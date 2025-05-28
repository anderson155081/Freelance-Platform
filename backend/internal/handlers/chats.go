package handlers

import (
	"net/http"
	"strconv"
	"time"

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
		query = query.Where("client_id = ? AND client_hidden = ?", currentUser.ID, false)
	} else {
		query = query.Where("freelancer_id = ? AND freelancer_hidden = ?", currentUser.ID, false)
	}

	if err := query.Order("updated_at DESC").Find(&chats).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch chats"})
		return
	}

	// Add unread count for each chat
	type ChatWithUnread struct {
		models.Chat
		UnreadCount int64 `json:"unread_count"`
	}

	var chatsWithUnread []ChatWithUnread
	for _, chat := range chats {
		var unreadCount int64
		database.DB.Model(&models.Message{}).
			Where("chat_id = ? AND sender_id != ? AND read_at IS NULL", chat.ID, currentUser.ID).
			Count(&unreadCount)
		
		chatsWithUnread = append(chatsWithUnread, ChatWithUnread{
			Chat:        chat,
			UnreadCount: unreadCount,
		})
	}

	c.JSON(http.StatusOK, gin.H{"chats": chatsWithUnread})
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

	// Check if chat is hidden for current user
	if (currentUser.Role == "client" && chat.ClientHidden) || 
	   (currentUser.Role == "freelancer" && chat.FreelancerHidden) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Chat not found"})
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

	// If chat is hidden for current user, unhide it when they send a message
	chatUpdated := false
	if currentUser.Role == "client" && chat.ClientHidden {
		chat.ClientHidden = false
		chatUpdated = true
	} else if currentUser.Role == "freelancer" && chat.FreelancerHidden {
		chat.FreelancerHidden = false
		chatUpdated = true
	}

	// Save chat if it was updated
	if chatUpdated {
		if err := database.DB.Save(&chat).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update chat"})
			return
		}
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

// MarkMessagesAsRead marks all messages in a chat as read for the current user
func MarkMessagesAsRead(c *gin.Context) {
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

	// Mark all unread messages in this chat as read (except messages sent by current user)
	now := time.Now()
	if err := database.DB.Model(&models.Message{}).
		Where("chat_id = ? AND sender_id != ? AND read_at IS NULL", chatID, currentUser.ID).
		Update("read_at", now).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark messages as read"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}

// GetUnreadCount returns the total unread message count for the current user
func GetUnreadCount(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	currentUser := user.(models.User)

	// Count unread messages across all chats where user is participant
	var unreadCount int64
	
	// Get all chat IDs where user is participant
	var chatIDs []uint
	if currentUser.Role == "client" {
		database.DB.Model(&models.Chat{}).Where("client_id = ? AND client_hidden = ?", currentUser.ID, false).Pluck("id", &chatIDs)
	} else {
		database.DB.Model(&models.Chat{}).Where("freelancer_id = ? AND freelancer_hidden = ?", currentUser.ID, false).Pluck("id", &chatIDs)
	}

	// Count unread messages in these chats (excluding messages sent by current user)
	if len(chatIDs) > 0 {
		database.DB.Model(&models.Message{}).
			Where("chat_id IN ? AND sender_id != ? AND read_at IS NULL", chatIDs, currentUser.ID).
			Count(&unreadCount)
	}

	c.JSON(http.StatusOK, gin.H{"unread_count": unreadCount})
}

// DeleteChat hides a chat for the current user (doesn't delete for other participant)
func DeleteChat(c *gin.Context) {
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

	// Hide the chat for the current user only
	if currentUser.Role == "client" {
		chat.ClientHidden = true
	} else {
		chat.FreelancerHidden = true
	}

	// Save the updated chat
	if err := database.DB.Save(&chat).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hide chat"})
		return
	}

	// If both users have hidden the chat, we can safely delete it and all messages
	if chat.ClientHidden && chat.FreelancerHidden {
		// Delete all messages in this chat first
		if err := database.DB.Where("chat_id = ?", chatID).Delete(&models.Message{}).Error; err != nil {
			// Log error but don't fail the request
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete chat messages"})
			return
		}

		// Delete the chat
		if err := database.DB.Delete(&chat).Error; err != nil {
			// Log error but don't fail the request
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete chat"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Chat hidden successfully"})
} 