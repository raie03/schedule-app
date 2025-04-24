package handlers

import (
	"math/rand"
	"net/http"
	"sort"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/raie03/schedule-app/backend/internal/models"
	"gorm.io/gorm"
)

// Handler handles HTTP requests
type Handler struct {
	db *gorm.DB
}

// NewHandler creates a new handler instance
func NewHandler(db *gorm.DB) *Handler {
	return &Handler{db: db}
}

// generateEventID generates a unique ID for an event
func generateEventID() string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	rand.Seed(time.Now().UnixNano())

	length := 10
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}
	return string(b)
}

// CreateEvent creates a new event with performances
func (h *Handler) CreateEvent(c *gin.Context) {
	var req models.CreateEventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create event
	event := models.Event{
		ID:          generateEventID(),
		Title:       req.Title,
		Description: req.Description,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	// Create dates
	var dates []models.Date
	for _, dateStr := range req.Dates {
		date := models.Date{
			EventID: event.ID,
			Value:   dateStr,
		}
		dates = append(dates, date)
	}
	event.Dates = dates

	// Create performances
	var performances []models.Performance
	for _, perfReq := range req.Performances {
		perf := models.Performance{
			EventID:     event.ID,
			Title:       perfReq.Title,
			Description: perfReq.Description,
		}
		performances = append(performances, perf)
	}
	event.Performances = performances

	// Save to database
	tx := h.db.Begin()
	if err := tx.Create(&event).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create event"})
		return
	}
	tx.Commit()

	c.JSON(http.StatusCreated, event)
}

// GetEvent retrieves an event by ID including performances
func (h *Handler) GetEvent(c *gin.Context) {
	id := c.Param("id")

	var event models.Event
	if err := h.db.Preload("Dates").Preload("Performances").Where("id = ?", id).First(&event).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
		return
	}

	c.JSON(http.StatusOK, event)
}

// AddResponse adds a new response with performance selections
func (h *Handler) AddResponse(c *gin.Context) {
	id := c.Param("id")

	// Check if event exists
	var event models.Event
	if err := h.db.Preload("Dates").Preload("Performances").Where("id = ?", id).First(&event).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
		return
	}

	var req models.CreateResponseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create response
	response := models.Response{
		EventID:   id,
		Name:      req.Name,
		CreatedAt: time.Now(),
	}

	// Start transaction
	tx := h.db.Begin()
	if err := tx.Create(&response).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create response"})
		return
	}

	// Create answers
	var answers []models.ResponseAnswer
	for dateID, status := range req.Answers {
		answer := models.ResponseAnswer{
			ResponseID: response.ID,
			DateID:     dateID,
			Status:     status,
		}
		answers = append(answers, answer)
	}

	if err := tx.Create(&answers).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create answers"})
		return
	}

	// Create user performances
	var userPerformances []models.UserPerformance
	for _, perfID := range req.Performances {
		userPerf := models.UserPerformance{
			ResponseID:    response.ID,
			PerformanceID: perfID,
		}
		userPerformances = append(userPerformances, userPerf)
	}

	if err := tx.Create(&userPerformances).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user performances"})
		return
	}

	tx.Commit()
	c.JSON(http.StatusCreated, gin.H{"message": "Response added successfully"})
}

// GetResponses retrieves all responses for an event including performance selections
func (h *Handler) GetResponses(c *gin.Context) {
	id := c.Param("id")

	// Check if event exists
	var event models.Event
	if err := h.db.Where("id = ?", id).First(&event).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
		return
	}

	// Get responses with answers and performances
	var responses []models.Response
	if err := h.db.Preload("Answers").Preload("Performances").Where("event_id = ?", id).Find(&responses).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get responses"})
		return
	}

	c.JSON(http.StatusOK, responses)
}

// AnaliyzeConflicts analyzes scheduling conflicts for an event
func (h *Handler) AnalyzeConflicts(c *gin.Context) {
	id := c.Param("id")

	var req models.ConflictAnalysisRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get event with dates and performances
	var event models.Event
	query := h.db.Preload("Dates").Preload("Performances")
	if err := query.Where("id = ?", id).First(&event).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
		return
	}

	// Get all responses with their performance selections and answers
	var responses []models.Response
	responseQuery := h.db.Preload("Answers").Preload("Performances")
	if err := responseQuery.Where("event_id = ?", id).Find(&responses).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get responses"})
		return
	}

	// Filter dates if specified
	datesToAnalyze := event.Dates
	if len(req.DateIDs) > 0 {
		var filteredDates []models.Date
		for _, date := range datesToAnalyze {
			for _, requestedID := range req.DateIDs {
				if date.ID == requestedID {
					filteredDates = append(filteredDates, date)
					break
				}
			}
		}
		datesToAnalyze = filteredDates
	}

	// Analyze conflicts
	var conflictReports []models.ConflictReport

	for _, date := range datesToAnalyze {
		// Get users available on this date and their performances
		type userInfo struct {
			Name         string
			Performances []uint // Performance IDs
		}

		availableUsers := make(map[string]userInfo)

		for _, response := range responses {
			// Check if the user is available on this date
			isAvailable := false
			for _, answer := range response.Answers {
				if answer.DateID == date.ID && (answer.Status == "available" || answer.Status == "maybe") {
					isAvailable = true
					break
				}
			}

			if isAvailable {
				// Get user's performances
				var performanceIDs []uint
				for _, perf := range response.Performances {
					performanceIDs = append(performanceIDs, perf.PerformanceID)
				}

				availableUsers[response.Name] = userInfo{
					Name:         response.Name,
					Performances: performanceIDs,
				}
			}
		}

		// For this date, check which performances are scheduled
		// In a real app, you'd have a separate table for scheduled performances per date
		// For simplicity, we'll assume all performances might happen on each date

		// Check for conflicts: users who are in multiple performances on same date
		var conflictingUsers []string

		for userName, info := range availableUsers {
			if len(info.Performances) > 1 {
				conflictingUsers = append(conflictingUsers, userName)
			}
		}

		if len(conflictingUsers) > 0 {
			conflictReports = append(conflictReports, models.ConflictReport{
				Date:             date,
				Performances:     event.Performances,
				ConflictingUsers: conflictingUsers,
			})
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"conflicts": conflictReports,
	})
}

// SuggestOptimalSchedule suggests an optimal schedule minimizing conflicts
// func (h *Handler) SuggestOptimalSchedule(c *gin.Context) {
// 	id := c.Param("id")

// 	// Get event with dates and performances
// 	var event models.Event
// 	query := h.db.Preload("Dates").Preload("Performances")
// 	if err := query.Where("id = ?", id).First(&event).Error; err != nil {
// 		c.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
// 		return
// 	}

// 	// Get all responses with their performance selections and answers
// 	var responses []models.Response
// 	responseQuery := h.db.Preload("Answers").Preload("Performances")
// 	if err := responseQuery.Where("event_id = ?", id).Find(&responses).Error; err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get responses"})
// 		return
// 	}

// 	// Simple greedy algorithm for scheduling:
// 	// For each performance, find the date with most available participants and least conflicts

// 	type PerformanceScore struct {
// 		PerformanceID  uint
// 		DateID         uint
// 		AvailableCount int
// 		ConflictCount  int
// 	}

// 	var bestSchedules []PerformanceScore

// 	for _, performance := range event.Performances {
// 		var bestScore PerformanceScore
// 		bestScore.PerformanceID = performance.ID

// 		for _, date := range event.Dates {
// 			var availableCount, conflictCount int

// 			for _, response := range responses {
// 				// Check if user is in this performance
// 				isInPerformance := false
// 				for _, userPerf := range response.Performances {
// 					if userPerf.PerformanceID == performance.ID {
// 						isInPerformance = true
// 						break
// 					}
// 				}

// 				if !isInPerformance {
// 					continue
// 				}

// 				// Check if available on this date
// 				isAvailable := false
// 				for _, answer := range response.Answers {
// 					if answer.DateID == date.ID && (answer.Status == "available" || answer.Status == "maybe") {
// 						isAvailable = true
// 						break
// 					}
// 				}

// 				if isAvailable {
// 					availableCount++

// 					// Check if user has conflict (in multiple performances)
// 					if len(response.Performances) > 1 {
// 						conflictCount++
// 					}
// 				}
// 			}

// 			// Update bset score if better
// 			if availableCount > bestScore.AvailableCount ||
// 				(availableCount == bestScore.AvailableCount && conflictCount < bestScore.ConflictCount) {
// 				bestScore.DateID = date.ID
// 				bestScore.AvailableCount = availableCount
// 				bestScore.ConflictCount = conflictCount
// 			}
// 		}

// 		bestSchedules = append(bestSchedules, bestScore)
// 	}

// 	// Return the suggested schedule
// 	c.JSON(http.StatusOK, gin.H{
// 		"suggested_schedule": bestSchedules,
// 	})
// }

// SuggestOptimalSchedule suggests an optimal schedule minimizing conflicts
func (h *Handler) SuggestOptimalSchedule(c *gin.Context) {
	id := c.Param("id")
	startTime := time.Now() // パフォーマンス計測開始

	// Get event with dates and performances - 必要なデータのみロード
	var event models.Event
	query := h.db.Preload("Dates").Preload("Performances")
	if err := query.Where("id = ?", id).First(&event).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
		return
	}

	// データサイズの事前確保による最適化
	// 初期容量を指定することでスライスの再割り当てを減らす
	perfCount := len(event.Performances)
	dateCount := len(event.Dates)

	// 高速ルックアップのためのインデックスマップを作成
	perfMap := make(map[uint]*models.Performance, perfCount)
	dateMap := make(map[uint]*models.Date, dateCount)

	for i := range event.Performances {
		perfMap[event.Performances[i].ID] = &event.Performances[i]
	}

	for i := range event.Dates {
		dateMap[event.Dates[i].ID] = &event.Dates[i]
	}

	// Get all responses with their performance selections and answers
	var responses []models.Response
	responseQuery := h.db.Preload("Answers").Preload("Performances")
	if err := responseQuery.Where("event_id = ?", id).Find(&responses).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get responses"})
		return
	}

	// データ前処理: パフォーマンス参加と日付可用性のマップを構築
	// この前処理により、後のルックアップが O(1) 時間で行える
	type UserData struct {
		Name         string
		Performances map[uint]bool   // パフォーマンスID -> 参加するか
		Availability map[uint]string // 日付ID -> 可用性状態
	}

	users := make(map[string]*UserData, len(responses))

	for _, response := range responses {
		userData := &UserData{
			Name:         response.Name,
			Performances: make(map[uint]bool, len(response.Performances)),
			Availability: make(map[uint]string, len(response.Answers)),
		}

		// パフォーマンス参加情報をマップに格納
		for _, perf := range response.Performances {
			userData.Performances[perf.PerformanceID] = true
		}

		// 可用性情報をマップに格納
		for _, answer := range response.Answers {
			userData.Availability[answer.DateID] = answer.Status
		}

		users[response.Name] = userData
	}

	// 全ての日付×パフォーマンス組み合わせのスコアを一度に計算
	// 二次元配列を使用して、頻繁なメモリアロケーションを避ける
	type ScoreData struct {
		AvailableCount   int
		MaybeCount       int
		TotalCount       int
		ConflictCount    int
		WeightedScore    float64
		ConflictingUsers []string
	}

	// スコアデータの二次元配列を初期化
	scores := make([][]ScoreData, perfCount)
	for i := range scores {
		scores[i] = make([]ScoreData, dateCount)
	}

	// パフォーマンスと日付のマッピング用インデックス
	perfIndex := make(map[uint]int, perfCount)
	dateIndex := make(map[uint]int, dateCount)

	for i, p := range event.Performances {
		perfIndex[p.ID] = i
	}

	for i, d := range event.Dates {
		dateIndex[d.ID] = i
	}

	// すべてのユーザーについて一度だけ処理することで、O(n³)からO(n²)に計算量を削減
	for _, userData := range users {
		// このユーザーが参加するパフォーマンスについて
		userPerfs := make([]uint, 0, len(userData.Performances))
		for perfID := range userData.Performances {
			userPerfs = append(userPerfs, perfID)
		}

		hasMultiplePerfs := len(userPerfs) > 1

		// このユーザーの各パフォーマンスと各日付の組み合わせをチェック
		for _, perfID := range userPerfs {
			pIdx := perfIndex[perfID]

			// このユーザーの各日付での可用性をチェック
			for dateID, status := range userData.Availability {
				dIdx, ok := dateIndex[dateID]
				if !ok {
					continue // 無効な日付IDはスキップ
				}

				scoreData := &scores[pIdx][dIdx]
				scoreData.TotalCount++

				// 可用性に応じてカウントとスコアを更新
				switch status {
				case "available":
					scoreData.AvailableCount++
					scoreData.WeightedScore += 1.0
				case "maybe":
					scoreData.MaybeCount++
					scoreData.WeightedScore += 0.5
				}

				// 複数パフォーマンスに参加する場合は潜在的コンフリクト
				if hasMultiplePerfs {
					scoreData.ConflictCount++
					if !containsString(scoreData.ConflictingUsers, userData.Name) {
						scoreData.ConflictingUsers = append(scoreData.ConflictingUsers, userData.Name)
					}
				}
			}
		}
	}

	// スコアの高い順にソートされた全組み合わせを作成
	type ScoredOption struct {
		PerformanceID    uint     `json:"performance_id"`
		DateID           uint     `json:"date_id"`
		PerformanceName  string   `json:"performance_name"`
		DateValue        string   `json:"date_value"`
		AvailableCount   int      `json:"available_count"`
		MaybeCount       int      `json:"maybe_count"`
		TotalCount       int      `json:"total_count"`
		ConflictCount    int      `json:"conflict_count"`
		WeightedScore    float64  `json:"weighted_score"`
		ConflictingUsers []string `json:"conflicting_users"`
	}

	allOptions := make([]ScoredOption, 0, perfCount*dateCount)

	// 全ての組み合わせをフラットなリストに変換
	for pIdx, perfScores := range scores {
		perfID := event.Performances[pIdx].ID
		perfName := event.Performances[pIdx].Title

		for dIdx, score := range perfScores {
			dateID := event.Dates[dIdx].ID
			dateValue := event.Dates[dIdx].Value

			option := ScoredOption{
				PerformanceID:    perfID,
				DateID:           dateID,
				PerformanceName:  perfName,
				DateValue:        dateValue,
				AvailableCount:   score.AvailableCount,
				MaybeCount:       score.MaybeCount,
				TotalCount:       score.TotalCount,
				ConflictCount:    score.ConflictCount,
				WeightedScore:    score.WeightedScore,
				ConflictingUsers: score.ConflictingUsers,
			}

			allOptions = append(allOptions, option)
		}
	}

	// スコアの高い順にソート - クイックソートを利用
	sort.Slice(allOptions, func(i, j int) bool {
		// 主要ソート基準: 重み付きスコア (高いほど良い)
		if allOptions[i].WeightedScore != allOptions[j].WeightedScore {
			return allOptions[i].WeightedScore > allOptions[j].WeightedScore
		}

		// 二次ソート基準: コンフリクト数 (少ないほど良い)
		if allOptions[i].ConflictCount != allOptions[j].ConflictCount {
			return allOptions[i].ConflictCount < allOptions[j].ConflictCount
		}

		// 三次ソート基準: available人数 (多いほど良い)
		if allOptions[i].AvailableCount != allOptions[j].AvailableCount {
			return allOptions[i].AvailableCount > allOptions[j].AvailableCount
		}

		// 四次ソート基準: maybe人数 (多いほど良い)
		return allOptions[i].MaybeCount > allOptions[j].MaybeCount
	})

	// 最適なスケジュールの構築 - 高速なルックアップのためにマップを使用
	assignedPerfs := make(map[uint]bool, perfCount)
	assignedDates := make(map[uint]bool, dateCount)
	var bestSchedule []ScoredOption

	// まずは日付の重複を避けてスケジュール
	for _, option := range allOptions {
		// すでに割り当て済みのパフォーマンスや日付はスキップ
		if assignedPerfs[option.PerformanceID] || assignedDates[option.DateID] {
			continue
		}

		// 割り当て
		assignedPerfs[option.PerformanceID] = true
		assignedDates[option.DateID] = true
		bestSchedule = append(bestSchedule, option)

		// すべてのパフォーマンスがスケジュールされたら終了
		if len(assignedPerfs) == perfCount {
			break
		}
	}

	// 日付の重複を許容しても割り当てられなかったパフォーマンスがあれば対応
	if len(assignedPerfs) < perfCount {
		// 日付の割り当てをリセット、パフォーマンスの割り当ては維持
		for _, option := range allOptions {
			// すでに割り当て済みのパフォーマンスはスキップ
			if assignedPerfs[option.PerformanceID] {
				continue
			}

			// 割り当て (日付の重複を許容)
			assignedPerfs[option.PerformanceID] = true
			bestSchedule = append(bestSchedule, option)

			// すべてのパフォーマンスがスケジュールされたら終了
			if len(assignedPerfs) == perfCount {
				break
			}
		}
	}

	// 計算時間と統計情報を計測
	elapsedTime := time.Since(startTime)

	// 全体のスコアと統計を計算
	var totalWeightedScore float64
	var totalConflicts int
	var totalAvailable int
	var totalMaybe int

	for _, opt := range bestSchedule {
		totalWeightedScore += opt.WeightedScore
		totalConflicts += opt.ConflictCount
		totalAvailable += opt.AvailableCount
		totalMaybe += opt.MaybeCount
	}

	// 結果を返す - 計算時間の情報も含める
	c.JSON(http.StatusOK, gin.H{
		"suggested_schedule": bestSchedule,
		"metrics": gin.H{
			"total_weighted_score":   totalWeightedScore,
			"total_conflicts":        totalConflicts,
			"total_available":        totalAvailable,
			"total_maybe":            totalMaybe,
			"performance_count":      perfCount,
			"scheduled_performances": len(bestSchedule),
			"computation_time_ms":    float64(elapsedTime.Microseconds()) / 1000.0,
		},
	})
}

// containsString は文字列スライス内に特定の文字列が含まれているかをチェック
func containsString(slice []string, s string) bool {
	for _, item := range slice {
		if item == s {
			return true
		}
	}
	return false
}

// bitCount は1が立っているビット数をカウント
func bitCount(n uint64) int {
	count := 0
	for n > 0 {
		count += int(n & 1)
		n >>= 1
	}
	return count
}
