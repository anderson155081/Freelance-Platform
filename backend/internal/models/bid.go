package models

import (
	"time"

	"gorm.io/gorm"
)

type Bid struct {
	ID           uint           `json:"id" gorm:"primaryKey"`
	ProjectID    uint           `json:"project_id" gorm:"not null"`
	Project      Project        `json:"project,omitempty"`
	FreelancerID uint           `json:"freelancer_id" gorm:"not null"`
	Freelancer   User           `json:"freelancer,omitempty"`
	Amount       int            `json:"amount" gorm:"not null"` // Amount in TWD
	Proposal     string         `json:"proposal" gorm:"type:text"` // Detailed proposal
	Timeline     string         `json:"timeline"` // e.g., "2週", "1個月"
	Status       string         `json:"status" gorm:"default:pending"` // pending, accepted, rejected
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
} 