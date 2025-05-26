package handlers

import (
	"net/http"
	"strconv"

	"freelance-platform/internal/database"
	"freelance-platform/internal/models"

	"github.com/gin-gonic/gin"
)

type CreateChatRequest struct {
	ProjectID    uint `json:"project_id" binding:"required"`
	FreelancerID uint `json:"freelancer_id" binding:"required"`
}

type SendMessageRequest struct {
	ChatID  uint   `json:"chat_id" binding:"required"`
	Content string `json:"content" binding:"required"`
	Type    string `json:"type"` // defaults to "text"
}

// GetChats returns all chats for the current user
func GetChats(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	currentUser := user.(models.User)
	var chats []models.Chat

	// Get chats where user is either client or freelancer
	query := database.DB.Preload("Project").Preload("Client").Preload("Freelancer")
	if currentUser.Role == "client" {
		query = query.Where("client_id = ?", currentUser.ID)
	} else {
		query = query.Where("freelancer_id = ?", currentUser.ID)
	}

	if err := query.Order("updated_at DESC").Find(&chats).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch chats"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"chats": chats})
}

// CreateChat creates a new chat between client and freelancer for a project
func CreateChat(c *gin.Context) {
	var req CreateChatRequest
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

	// Only clients can create chats
	if currentUser.Role != "client" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only clients can create chats"})
		return
	}

	// Verify project exists and user owns it
	var project models.Project
	if err := database.DB.First(&project, req.ProjectID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}

	if project.ClientID != currentUser.ID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only create chats for your own projects"})
		return
	}

	// Verify freelancer exists
	var freelancer models.User
	if err := database.DB.First(&freelancer, req.FreelancerID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Freelancer not found"})
		return
	}

	if freelancer.Role != "freelancer" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Selected user is not a freelancer"})
		return
	}

	// Check if chat already exists
	var existingChat models.Chat
	if err := database.DB.Where("project_id = ? AND client_id = ? AND freelancer_id = ?", 
		req.ProjectID, currentUser.ID, req.FreelancerID).First(&existingChat).Error; err == nil {
		// Chat already exists, return it
		database.DB.Preload("Project").Preload("Client").Preload("Freelancer").First(&existingChat, existingChat.ID)
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

// GetChatMessages returns all messages for a specific chat
func GetChatMessages(c *gin.Context) {
	chatID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid chat ID"})
		return
	}

	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	currentUser := user.(models.User)

	// Verify user has access to this chat
	var chat models.Chat
	if err := database.DB.First(&chat, chatID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Chat not found"})
		return
	}

	if chat.ClientID != currentUser.ID && chat.FreelancerID != currentUser.ID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have access to this chat"})
		return
	}

	// Get messages for this chat
	var messages []models.Message
	if err := database.DB.Preload("Sender").Where("chat_id = ?", chatID).Order("created_at ASC").Find(&messages).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch messages"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"messages": messages})
}

// SendMessage sends a new message in a chat
func SendMessage(c *gin.Context) {
	var req SendMessageRequest
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

	// Verify user has access to this chat
	var chat models.Chat
	if err := database.DB.First(&chat, req.ChatID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Chat not found"})
		return
	}

	if chat.ClientID != currentUser.ID && chat.FreelancerID != currentUser.ID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have access to this chat"})
		return
	}

	// Create message
	message := models.Message{
		ChatID:   req.ChatID,
		SenderID: currentUser.ID,
		Content:  req.Content,
		Type:     req.Type,
	}

	if message.Type == "" {
		message.Type = "text"
	}

	if err := database.DB.Create(&message).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send message"})
		return
	}

	// Update chat's updated_at timestamp
	database.DB.Model(&chat).Update("updated_at", message.CreatedAt)

	// Load sender relationship
	database.DB.Preload("Sender").First(&message, message.ID)

	c.JSON(http.StatusCreated, gin.H{"message": message})
} 