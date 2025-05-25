package handlers

import (
	"net/http"

	"freelance-platform/internal/database"
	"freelance-platform/internal/models"

	"github.com/gin-gonic/gin"
)

type ChatRequest struct {
	ProjectID    uint `json:"project_id" binding:"required"`
	FreelancerID uint `json:"freelancer_id" binding:"required"`
}

func GetChats(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	currentUser := user.(models.User)
	
	var chats []models.Chat
	if err := database.DB.Where("client_id = ? OR freelancer_id = ?", currentUser.ID, currentUser.ID).
		Preload("Project").Preload("Client").Preload("Freelancer").Find(&chats).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch chats"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"chats": chats})
}

func CreateChat(c *gin.Context) {
	var req ChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	currentUser := user.(models.User)

	// Verify project exists and user is the client
	var project models.Project
	if err := database.DB.First(&project, req.ProjectID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}

	if project.ClientID != currentUser.ID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only create chats for your own projects"})
		return
	}

	// Check if chat already exists
	var existingChat models.Chat
	if err := database.DB.Where("project_id = ? AND client_id = ? AND freelancer_id = ?", 
		req.ProjectID, currentUser.ID, req.FreelancerID).First(&existingChat).Error; err == nil {
		c.JSON(http.StatusOK, gin.H{"chat": existingChat})
		return
	}

	// Create new chat
	chat := models.Chat{
		ProjectID:    req.ProjectID,
		ClientID:     currentUser.ID,
		FreelancerID: req.FreelancerID,
	}

	if err := database.DB.Create(&chat).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create chat"})
		return
	}

	// Load relationships
	database.DB.Preload("Project").Preload("Client").Preload("Freelancer").First(&chat, chat.ID)

	c.JSON(http.StatusCreated, gin.H{"chat": chat})
}

// Placeholder for WebSocket handler - in a real implementation, this would handle WebSocket connections
func HandleWebSocket(c *gin.Context) {
	// This is a placeholder for WebSocket implementation
	// In a real implementation, you would:
	// 1. Upgrade the HTTP connection to WebSocket
	// 2. Handle real-time messaging
	// 3. Manage connection state
	
	roomID := c.Param("room_id")
	c.JSON(http.StatusOK, gin.H{
		"message": "WebSocket endpoint - not implemented yet",
		"room_id": roomID,
		"note": "This would handle real-time chat functionality",
	})
} 