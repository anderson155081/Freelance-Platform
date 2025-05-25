package models

import (
	"time"

	"gorm.io/gorm"
)

type Chat struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	ProjectID uint           `json:"project_id" gorm:"not null"`
	Project   Project        `json:"project,omitempty"`
	ClientID  uint           `json:"client_id" gorm:"not null"`
	Client    User           `json:"client,omitempty"`
	FreelancerID uint        `json:"freelancer_id" gorm:"not null"`
	Freelancer   User        `json:"freelancer,omitempty"`
	Messages  []Message      `json:"messages,omitempty"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

type Message struct {
	ID       uint           `json:"id" gorm:"primaryKey"`
	ChatID   uint           `json:"chat_id" gorm:"not null"`
	Chat     Chat           `json:"chat,omitempty"`
	SenderID uint           `json:"sender_id" gorm:"not null"`
	Sender   User           `json:"sender,omitempty"`
	Content  string         `json:"content" gorm:"type:text;not null"`
	Type     string         `json:"type" gorm:"default:text"` // text, file, image
	FileURL  string         `json:"file_url"`
	ReadAt   *time.Time     `json:"read_at"`
	CreatedAt time.Time     `json:"created_at"`
	UpdatedAt time.Time     `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
} 