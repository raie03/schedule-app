package handlers

import (
	"math/rand"
	"net/http"
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
func (h *Handler) SuggestOptimalSchedule(c *gin.Context) {
	id := c.Param("id")

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

	// Simple greedy algorithm for scheduling:
	// For each performance, find the date with most available participants and least conflicts

	type PerformanceScore struct {
		PerformanceID  uint
		DateID         uint
		AvailableCount int
		ConflictCount  int
	}

	var bestSchedules []PerformanceScore

	for _, performance := range event.Performances {
		var bestScore PerformanceScore
		bestScore.PerformanceID = performance.ID

		for _, date := range event.Dates {
			var availableCount, conflictCount int

			for _, response := range responses {
				// Check if user is in this performance
				isInPerformance := false
				for _, userPerf := range response.Performances {
					if userPerf.PerformanceID == performance.ID {
						isInPerformance = true
						break
					}
				}

				if !isInPerformance {
					continue
				}

				// Check if available on this date
				isAvailable := false
				for _, answer := range response.Answers {
					if answer.DateID == date.ID && (answer.Status == "available" || answer.Status == "maybe") {
						isAvailable = true
						break
					}
				}

				if isAvailable {
					availableCount++

					// Check if user has conflict (in multiple performances)
					if len(response.Performances) > 1 {
						conflictCount++
					}
				}
			}

			// Update bset score if better
			if availableCount > bestScore.AvailableCount ||
				(availableCount == bestScore.AvailableCount && conflictCount < bestScore.ConflictCount) {
				bestScore.DateID = date.ID
				bestScore.AvailableCount = availableCount
				bestScore.ConflictCount = conflictCount
			}
		}

		bestSchedules = append(bestSchedules, bestScore)
	}

	// Return the suggested schedule
	c.JSON(http.StatusOK, gin.H{
		"suggested_schedule": bestSchedules,
	})
}
