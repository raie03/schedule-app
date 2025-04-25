package algorithm

import (
	"fmt"
	"math"
	"math/rand"
	"time"

	"github.com/raie03/schedule-app/backend/internal/models"
)

// // UserData は各ユーザーの参加情報を保持します
// type UserData struct {
// 	Name         string
// 	Performances map[uint]bool   // パフォーマンスID -> 参加するか
// 	Availability map[uint]string // 日付ID -> 可用性状態
// }

// Schedule はパフォーマンスから日付へのマッピングを表します
type Schedule map[uint]uint // performanceID -> dateID

// OptimizeSchedule はグローバル最適化アルゴリズムを使用して最適なスケジュールを生成します
func OptimizeSchedule(allOptions []models.ScoredOption, perfCount int, dateCount int, users map[string]*models.UserData) []models.ScoredOption {
	// オプションをマップに変換して高速なルックアップを可能にする
	optionMap := make(map[string]models.ScoredOption)
	for _, opt := range allOptions {
		key := getOptionKey(opt.PerformanceID, opt.DateID)
		optionMap[key] = opt
	}

	// パフォーマンスIDのリスト
	perfIDs := make([]uint, 0, perfCount)
	for _, opt := range allOptions {
		found := false
		for _, id := range perfIDs {
			if id == opt.PerformanceID {
				found = true
				break
			}
		}
		if !found {
			perfIDs = append(perfIDs, opt.PerformanceID)
		}
	}

	// 初期解の生成（貪欲法）
	initialSchedule := buildInitialSchedule(allOptions, perfCount)

	// 焼きなまし法によるグローバル最適化
	optimizedSchedule := simulatedAnnealing(initialSchedule, optionMap, perfIDs, users, 10000, 0.99)

	// スケジュールをScoredOptionのリストに変換
	result := make([]models.ScoredOption, 0, len(optimizedSchedule))
	for perfID, dateID := range optimizedSchedule {
		key := getOptionKey(perfID, dateID)
		if opt, exists := optionMap[key]; exists {
			// コンフリクトのリストを再計算
			conflictingUsers := calculateConflictingUsers(optimizedSchedule, users, perfID, dateID)

			// 複製して更新したオプションを作成
			updatedOpt := opt
			updatedOpt.ConflictCount = len(conflictingUsers)
			updatedOpt.ConflictingUsers = conflictingUsers

			result = append(result, updatedOpt)
		}
	}

	return result
}

// buildInitialSchedule は貪欲法を使用して初期スケジュールを構築します
func buildInitialSchedule(allOptions []models.ScoredOption, perfCount int) Schedule {
	// スコアの高い順にソート済みと仮定

	schedule := make(Schedule, perfCount)
	assignedDates := make(map[uint]bool)

	// まず日付の重複を避けてスケジュール
	for _, opt := range allOptions {
		if _, exists := schedule[opt.PerformanceID]; exists {
			// このパフォーマンスは既に割り当て済み
			continue
		}

		if assignedDates[opt.DateID] {
			// この日付は既に別のパフォーマンスに割り当て済み
			continue
		}

		// 割り当て
		schedule[opt.PerformanceID] = opt.DateID
		assignedDates[opt.DateID] = true

		// すべてのパフォーマンスがスケジュールされたら終了
		if len(schedule) == perfCount {
			break
		}
	}

	// 割り当てられなかったパフォーマンスを、日付の重複を許容して割り当て
	if len(schedule) < perfCount {
		for _, opt := range allOptions {
			if _, exists := schedule[opt.PerformanceID]; exists {
				// このパフォーマンスは既に割り当て済み
				continue
			}

			// 割り当て (日付の重複を許容)
			schedule[opt.PerformanceID] = opt.DateID

			// すべてのパフォーマンスがスケジュールされたら終了
			if len(schedule) == perfCount {
				break
			}
		}
	}

	return schedule
}

// simulatedAnnealing は焼きなまし法を使用してスケジュールを最適化します
func simulatedAnnealing(initialSchedule Schedule, optionMap map[string]models.ScoredOption,
	perfIDs []uint, users map[string]*models.UserData,
	maxIterations int, coolingRate float64) Schedule {
	// 乱数ジェネレータの初期化
	rand.Seed(time.Now().UnixNano())

	currentSchedule := copySchedule(initialSchedule)
	bestSchedule := copySchedule(initialSchedule)

	currentEnergy := calculateEnergy(currentSchedule, optionMap, users)
	bestEnergy := currentEnergy

	temperature := 100.0 // 初期温度

	for iteration := 0; iteration < maxIterations && temperature > 0.1; iteration++ {
		// 隣接解の生成: ランダムなパフォーマンスを選択し、異なる日付に移動
		neighborSchedule := generateNeighbor(currentSchedule, perfIDs, optionMap)

		// エネルギー（コスト）の計算 - 低いほど良い
		neighborEnergy := calculateEnergy(neighborSchedule, optionMap, users)

		// 解の採用判定
		if acceptSolution(currentEnergy, neighborEnergy, temperature) {
			currentSchedule = copySchedule(neighborSchedule)
			currentEnergy = neighborEnergy

			// より良い解が見つかれば保存
			if currentEnergy < bestEnergy {
				bestSchedule = copySchedule(currentSchedule)
				bestEnergy = currentEnergy
			}
		}

		// 温度の冷却
		temperature *= coolingRate
	}

	return bestSchedule
}

// generateNeighbor はランダムなパフォーマンスを選んで異なる日付に割り当てます
func generateNeighbor(schedule Schedule, perfIDs []uint, optionMap map[string]models.ScoredOption) Schedule {
	neighbor := copySchedule(schedule)

	// ランダムにパフォーマンスを選択
	perfIndex := rand.Intn(len(perfIDs))
	perfID := perfIDs[perfIndex]

	// そのパフォーマンスに有効な日付の候補を取得
	validDates := make([]uint, 0)
	for key := range optionMap {
		opt := optionMap[key]
		if opt.PerformanceID == perfID {
			validDates = append(validDates, opt.DateID)
		}
	}

	if len(validDates) > 0 {
		// ランダムに新しい日付を選択（現在と同じ可能性もあり）
		dateIndex := rand.Intn(len(validDates))
		neighbor[perfID] = validDates[dateIndex]
	}

	return neighbor
}

// calculateConflictingUsers は特定のパフォーマンスと日付の組み合わせについて
// コンフリクトするユーザーのリストを計算します
func calculateConflictingUsers(schedule Schedule, users map[string]*models.UserData, targetPerfID, targetDateID uint) []string {
	// この日付に割り当てられたパフォーマンスを特定
	datePerformances := make([]uint, 0)
	for perfID, dateID := range schedule {
		if dateID == targetDateID {
			datePerformances = append(datePerformances, perfID)
		}
	}

	// 単一のパフォーマンスしかないならコンフリクトはない
	if len(datePerformances) <= 1 {
		return []string{}
	}

	// コンフリクトするユーザーを検出
	conflictingUsers := make([]string, 0)
	for userName, userData := range users {
		// このユーザーが対象のパフォーマンスに参加するか
		if !userData.Performances[targetPerfID] {
			continue
		}

		// この日に参加可能か
		availability := userData.Availability[targetDateID]
		if availability != "available" && availability != "maybe" {
			continue
		}

		// 同日の他のパフォーマンスにも参加するか
		conflictDetected := false
		for _, otherPerfID := range datePerformances {
			if otherPerfID != targetPerfID && userData.Performances[otherPerfID] {
				conflictDetected = true
				break
			}
		}

		if conflictDetected {
			conflictingUsers = append(conflictingUsers, userName)
		}
	}

	return conflictingUsers
}

// calculateEnergy はスケジュールの「エネルギー」（コスト）を計算します
// 低いほど良いスケジュールを意味します
func calculateEnergy(schedule Schedule, optionMap map[string]models.ScoredOption, users map[string]*models.UserData) float64 {
	// 日付ごとに割り当てられたパフォーマンスを追跡
	dateToPerfs := make(map[uint][]uint)
	for perfID, dateID := range schedule {
		dateToPerfs[dateID] = append(dateToPerfs[dateID], perfID)
	}

	// 実際のコンフリクト数
	totalConflicts := 0.0
	conflictingUsers := make(map[string]bool)

	// 参加可能人数
	totalAvailable := 0.0

	// 各パフォーマンスとその日付について
	for perfID, dateID := range schedule {
		// この組み合わせの参加可能人数を取得
		key := getOptionKey(perfID, dateID)
		if opt, exists := optionMap[key]; exists {
			// 参加可能人数（多いほど良い → 負にして最小化問題に）
			totalAvailable -= float64(opt.AvailableCount) + (float64(opt.MaybeCount) * 0.5)

			// 参加不可人数（多いほど悪い → そのままプラスで最小化問題に）
			// 必要に応じてコメントアウトを解除
			// totalUnavailable += float64(opt.UnavailableCount) * 0.5
		}

		// コンフリクトの計算: 同じ日に複数のパフォーマンスに参加するユーザー
		if perfs, exists := dateToPerfs[dateID]; exists && len(perfs) > 1 {
			for userName, userData := range users {
				// このユーザーが現在のパフォーマンスに参加するか
				if !userData.Performances[perfID] {
					continue
				}

				// この日に参加可能か
				availability := userData.Availability[dateID]
				if availability != "available" && availability != "maybe" {
					continue
				}

				// 同日の他のパフォーマンスにも参加するか
				for _, otherPerfID := range perfs {
					if otherPerfID != perfID && userData.Performances[otherPerfID] {
						// まだカウントしていないユーザーのみ数える
						if !conflictingUsers[userName] {
							totalConflicts += 1.0
							conflictingUsers[userName] = true
						}
						break
					}
				}
			}
		}
	}

	// 日付の重複にペナルティを加える
	dateOverlapPenalty := 0.0
	for _, perfs := range dateToPerfs {
		if len(perfs) > 1 {
			// 日付あたりのパフォーマンス数が多いほど大きなペナルティ
			dateOverlapPenalty += math.Pow(float64(len(perfs)-1), 1.5) * 2.0
		}
	}

	// 総合的なエネルギー計算
	// - コンフリクト: 大きな重みで
	// - 参加可能人数: 負の値として
	// - 日付重複: ペナルティとして
	return (totalConflicts * 15.0) + totalAvailable + dateOverlapPenalty
}

// acceptSolution はエネルギーの差と温度に基づいて新しい解を受け入れるかを判定します
func acceptSolution(currentEnergy, newEnergy, temperature float64) bool {
	// より良い解は常に受け入れる
	if newEnergy < currentEnergy {
		return true
	}

	// 確率的に悪い解も受け入れる（温度が高いほど受け入れやすい）
	delta := newEnergy - currentEnergy
	probability := math.Exp(-delta / temperature)
	return rand.Float64() < probability
}

// copySchedule はスケジュールの深いコピーを作成します
func copySchedule(schedule Schedule) Schedule {
	copy := make(Schedule, len(schedule))
	for k, v := range schedule {
		copy[k] = v
	}
	return copy
}

// getOptionKey はパフォーマンスIDと日付IDからルックアップキーを生成します
func getOptionKey(perfID, dateID uint) string {
	return fmt.Sprintf("%d-%d", perfID, dateID)
}
