package models

import (
	"time"

	"gorm.io/gorm"
)

type Project struct {
	ID           uint           `json:"id" gorm:"primaryKey"`
	Title        string         `json:"title" gorm:"not null"`
	Description  string         `json:"description" gorm:"type:text"`
	Budget       float64        `json:"budget" gorm:"not null"`
	Currency     string         `json:"currency" gorm:"default:USD"`
	Category     string         `json:"category" gorm:"not null"`
	Skills       string         `json:"skills"` // JSON array of required skills
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