package models

import (
	"time"

	"gorm.io/gorm"
)

type Project struct {
	ID           uint           `json:"id" gorm:"primaryKey"`
	Title        string         `json:"title" gorm:"not null"`
	Description  string         `json:"description" gorm:"type:text"`
	// Budget range instead of single budget
	BudgetMin    int            `json:"budget_min" gorm:"not null"` // Budget in TWD
	BudgetMax    int            `json:"budget_max" gorm:"not null"` // Budget in TWD
	Currency     string         `json:"currency" gorm:"default:TWD"`
	Category     string         `json:"category" gorm:"not null"` // 商業設計, 程式開發, etc.
	Location     string         `json:"location" gorm:"not null"` // Remote, 台北市, etc.
	Skills       string         `json:"skills"` // JSON array of required skills
	Requirements string         `json:"requirements"` // JSON array of requirements
	Urgency      string         `json:"urgency" gorm:"default:一般"` // 急件, 一般
	Status       string         `json:"status" gorm:"default:open"` // open, in_progress, completed, cancelled
	ClientID     uint           `json:"client_id" gorm:"not null"`
	Client       User           `json:"client,omitempty"`
	FreelancerID *uint          `json:"freelancer_id"`
	Freelancer   *User          `json:"freelancer,omitempty"`
	Bids         []Bid          `json:"bids,omitempty"`
	Deadline     *time.Time     `json:"deadline"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
} 