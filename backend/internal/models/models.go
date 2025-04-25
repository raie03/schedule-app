package models

import (
	"time"
)

// Event represents a schedule coordination event
type Event struct {
	ID           string        `json:"id" gorm:"primaryKey"`
	Title        string        `json:"title" gorm:"not null"`
	Description  string        `json:"description"`
	Dates        []Date        `json:"dates" gorm:"foreignKey:EventID"`
	Performances []Performance `json:"performances" gorm:"foreignKey:EventID"`
	Responses    []Response    `json:"responses,omitempty" gorm:"foreignKey:EventID"`
	CreatedAt    time.Time     `json:"created_at"`
	UpdatedAt    time.Time     `json:"updated_at"`
}

// Date represents a date option for an event
type Date struct {
	ID      uint   `json:"id" gorm:"primaryKey"`
	EventID string `json:"event_id" gorm:"not null"`
	Value   string `json:"value" gorm:"not null"` // Format: "2025-04-15 15:00-17:00"
}

// Performance represents a performance/production in the event
type Performance struct {
	ID          uint   `json:"id" gorm:"primaryKey"`
	EventID     string `json:"event_id" gorm:"not null"`
	Title       string `json:"title" gorm:"not null"`
	Description string `json:"description"`
}

// Response represents a participant's response to the event
type Response struct {
	ID           uint              `json:"id" gorm:"primaryKey"`
	EventID      string            `json:"event_id" gorm:"not null"`
	Name         string            `json:"name" gorm:"not null"`
	Answers      []ResponseAnswer  `json:"answers,omitempty" gorm:"foreignKey:ResponseID"`
	Performances []UserPerformance `json:"performances,omitempty" gorm:"foreignKey:ResponseID"`
	CreatedAt    time.Time         `json:"created_at"`
}

// ResponseAnswer represents availability for a single date
type ResponseAnswer struct {
	ID         uint   `json:"id" gorm:"primaryKey"`
	ResponseID uint   `json:"response_id" gorm:"not null"`
	DateID     uint   `json:"date_id" gorm:"not null"`
	Status     string `json:"status" gorm:"not null"` // "available", "maybe", "unavailable"
}

// UserPerformance represents which performances a user participates in
type UserPerformance struct {
	ID            uint `json:"id" gorm:"primaryKey"`
	ResponseID    uint `json:"response_id" gorm:"not null"`
	PerformanceID uint `json:"performance_id" gorm:"not null"`
}

// ConflictReport represents a scheduling conflict analysis
type ConflictReport struct {
	Date             Date          `json:"date"`
	Performances     []Performance `json:"performances"`
	ConflictingUsers []string      `json:"conflicting_users"`
}

// CreateEventRequest represents the request to create a new event
type CreateEventRequest struct {
	Title        string   `json:"title" binding:"required"`
	Description  string   `json:"description"`
	Dates        []string `json:"dates" binding:"required,min=1"`
	Performances []struct {
		Title       string `json:"title" binding:"required"`
		Description string `json:"description"`
	} `json:"performances" binding:"required,min=1"`
}

// CreateResponseRequest represents the request to add a new response
type CreateResponseRequest struct {
	Name         string          `json:"name" binding:"required"`
	Answers      map[uint]string `json:"answers" binding:"required"`      // DateID -> Status
	Performances []uint          `json:"performances" binding:"required"` // Array of PerformanceID
}

// ConflictAnalysisRequest represents a request to analyze conflicts
type ConflictAnalysisRequest struct {
	DateIDs []uint `json:"date_ids"` // Optional filter for specific dates
}

// ScoredOption はスコア付けされたパフォーマンス×日程の組み合わせを表します
type ScoredOption struct {
	PerformanceID    uint     `json:"performance_id"`
	DateID           uint     `json:"date_id"`
	PerformanceName  string   `json:"performance_name"`
	DateValue        string   `json:"date_value"`
	AvailableCount   int      `json:"available_count"`
	MaybeCount       int      `json:"maybe_count"`
	UnavailableCount int      `json:"unavailable_count"`
	TotalCount       int      `json:"total_count"`
	ConflictCount    int      `json:"conflict_count"`
	WeightedScore    float64  `json:"weighted_score"`
	ConflictingUsers []string `json:"conflicting_users"`
}

type UserData struct {
	Name         string
	Performances map[uint]bool   // パフォーマンスID -> 参加するか
	Availability map[uint]string // 日付ID -> 可用性状態
}

// func (d Date) Value() (driver.Value, error) {
// 	bytes, err := json.Marshal(d)
// 	if err != nil {
// 		return nil, err
// 	}
// 	return string(bytes), nil
// }

// func (d *Date) Scan(value interface{}) error {
// 	switch v := value.(type) {
// 	case string:
// 		return json.Unmarshal([]byte(v), d)
// 	case []byte:
// 		return json.Unmarshal(v, d)
// 	default:
// 		return fmt.Errorf("unsupported type: %T", v)
// 	}
// }
