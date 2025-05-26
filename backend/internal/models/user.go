package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID           uint           `json:"id" gorm:"primaryKey"`
	Email        string         `json:"email" gorm:"uniqueIndex;not null"`
	Password     string         `json:"-" gorm:"not null"`
	Name         string         `json:"name" gorm:"not null"`
	Avatar       string         `json:"avatar"`
	Bio          string         `json:"bio"` // Self introduction
	Skills       string         `json:"skills"` // JSON array of skills for freelancers
	Role         string         `json:"role" gorm:"default:freelancer"` // freelancer (接案者), client (發案者)
	Rating       float64        `json:"rating" gorm:"default:0"`
	CompletedProjects int       `json:"completed_projects" gorm:"default:0"`
	// Professional fields for freelancers
	Profession   string         `json:"profession"` // 職業/專業領域
	Experience   string         `json:"experience"` // Work experience
	Portfolio    string         `json:"portfolio"` // Portfolio URL or description
	HourlyRate   int           `json:"hourly_rate"` // Hourly rate in TWD
	Available    bool          `json:"available" gorm:"default:true"` // Available for work
	// Location for Taiwan market
	City         string         `json:"city"` // City in Taiwan
	// Social links
	Website      string         `json:"website"`
	LinkedIn     string         `json:"linkedin"`
	GitHub       string         `json:"github"`
	
	Projects     []Project      `json:"projects,omitempty" gorm:"foreignKey:ClientID"`
	Bids         []Bid          `json:"bids,omitempty" gorm:"foreignKey:FreelancerID"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
} 