package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	Email     string         `json:"email" gorm:"uniqueIndex;not null"`
	Password  string         `json:"-" gorm:"not null"`
	Name      string         `json:"name" gorm:"not null"`
	Avatar    string         `json:"avatar"`
	Bio       string         `json:"bio"`
	Skills    string         `json:"skills"` // JSON array of skills
	Role      string         `json:"role" gorm:"default:freelancer"` // freelancer, client, admin
	Rating    float64        `json:"rating" gorm:"default:0"`
	Projects  []Project      `json:"projects,omitempty" gorm:"foreignKey:ClientID"`
	Bids      []Bid          `json:"bids,omitempty" gorm:"foreignKey:FreelancerID"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
} 