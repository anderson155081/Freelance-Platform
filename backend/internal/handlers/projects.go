package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"freelance-platform/internal/database"
	"freelance-platform/internal/models"

	"github.com/gin-gonic/gin"
)

type ProjectRequest struct {
	Title        string `json:"title" binding:"required"`
	Description  string `json:"description"`
	BudgetMin    int    `json:"budget_min" binding:"required,gt=0"`
	BudgetMax    int    `json:"budget_max" binding:"required,gt=0"`
	Category     string `json:"category" binding:"required"`
	Location     string `json:"location" binding:"required"`
	Skills       string `json:"skills"`
	Requirements string `json:"requirements"`
	Urgency      string `json:"urgency"`
}

type BidRequest struct {
	ProjectID uint   `json:"project_id" binding:"required"`
	Amount    int    `json:"amount" binding:"required,gt=0"`
	Proposal  string `json:"proposal" binding:"required"`
	Timeline  string `json:"timeline" binding:"required"`
}

func GetProjects(c *gin.Context) {
	var projects []models.Project
	
	query := database.DB.Preload("Client").Preload("Freelancer").Preload("Bids")
	
	// If requesting own projects, don't filter by status
	if c.Query("my_projects") != "true" {
		query = query.Where("status = ?", "open")
	} else {
		// For own projects, exclude deleted ones
		query = query.Where("status != ?", "deleted")
	}
	
	// Add filters for Taiwan market
	if category := c.Query("category"); category != "" && category != "全部類別" {
		query = query.Where("category = ?", category)
	}
	
	if location := c.Query("location"); location != "" && location != "全部地點" {
		query = query.Where("location = ?", location)
	}
	
	if urgency := c.Query("urgency"); urgency != "" {
		query = query.Where("urgency = ?", urgency)
	}
	
	// Budget range filter
	if minBudget := c.Query("min_budget"); minBudget != "" {
		if min, err := strconv.Atoi(minBudget); err == nil {
			query = query.Where("budget_max >= ?", min)
		}
	}
	
	if maxBudget := c.Query("max_budget"); maxBudget != "" {
		if max, err := strconv.Atoi(maxBudget); err == nil {
			query = query.Where("budget_min <= ?", max)
		}
	}
	
	// Search functionality
	if search := c.Query("search"); search != "" {
		searchTerm := "%" + strings.ToLower(search) + "%"
		query = query.Where("LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(skills) LIKE ?", 
			searchTerm, searchTerm, searchTerm)
	}
	
	// Pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset := (page - 1) * limit
	
	// Order by most recent first
	if err := query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&projects).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch projects"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"projects": projects})
}

func GetProject(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}
	
	var project models.Project
	if err := database.DB.Preload("Client").Preload("Freelancer").Preload("Bids.Freelancer").First(&project, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}
	
	// Check if project is deleted
	if project.Status == "deleted" {
		c.JSON(http.StatusGone, gin.H{
			"error":   "Project has been deleted",
			"message": "案件已被刪除",
			"deleted": true,
		})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"project": project})
}

func CreateProject(c *gin.Context) {
	var req ProjectRequest
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
	
	// Validate budget range
	if req.BudgetMin >= req.BudgetMax {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Budget minimum must be less than maximum"})
		return
	}
	
	project := models.Project{
		Title:        req.Title,
		Description:  req.Description,
		BudgetMin:    req.BudgetMin,
		BudgetMax:    req.BudgetMax,
		Currency:     "TWD",
		Category:     req.Category,
		Location:     req.Location,
		Skills:       req.Skills,
		Requirements: req.Requirements,
		Urgency:      req.Urgency,
		ClientID:     currentUser.ID,
		Status:       "open",
	}
	
	if project.Urgency == "" {
		project.Urgency = "一般"
	}
	
	if err := database.DB.Create(&project).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create project"})
		return
	}
	
	// Load the client relationship
	database.DB.Preload("Client").First(&project, project.ID)
	
	c.JSON(http.StatusCreated, gin.H{"project": project})
}

func UpdateProject(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}
	
	var req ProjectRequest
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
	
	var project models.Project
	if err := database.DB.First(&project, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}
	
	// Check if user owns the project
	if project.ClientID != currentUser.ID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only update your own projects"})
		return
	}
	
	// Validate budget range
	if req.BudgetMin >= req.BudgetMax {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Budget minimum must be less than maximum"})
		return
	}
	
	// Update project
	project.Title = req.Title
	project.Description = req.Description
	project.BudgetMin = req.BudgetMin
	project.BudgetMax = req.BudgetMax
	project.Currency = "TWD"
	project.Category = req.Category
	project.Location = req.Location
	project.Skills = req.Skills
	project.Requirements = req.Requirements
	if req.Urgency != "" {
		project.Urgency = req.Urgency
	}
	
	if err := database.DB.Save(&project).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update project"})
		return
	}
	
	// Load relationships
	database.DB.Preload("Client").Preload("Freelancer").First(&project, project.ID)
	
	c.JSON(http.StatusOK, gin.H{"project": project})
}

func DeleteProject(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}
	
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	
	currentUser := user.(models.User)
	
	var project models.Project
	if err := database.DB.First(&project, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}
	
	// Check if user owns the project
	if project.ClientID != currentUser.ID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only delete your own projects"})
		return
	}
	
	// Check if project is already deleted
	if project.Status == "deleted" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Project is already deleted"})
		return
	}
	
	// Find all chats related to this project
	var chats []models.Chat
	if err := database.DB.Where("project_id = ?", project.ID).Find(&chats).Error; err == nil {
		// Add system message to each chat before marking project as deleted
		for _, chat := range chats {
			systemMessage := models.Message{
				ChatID:   chat.ID,
				SenderID: currentUser.ID, // Use the project owner as sender
				Content:  "此案件已被發案者刪除。",
				Type:     "system",
			}
			database.DB.Create(&systemMessage)
		}
	}
	
	// Mark project as deleted instead of hard deleting
	project.Status = "deleted"
	if err := database.DB.Save(&project).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete project"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "Project deleted successfully"})
}

// Bidding functionality
func CreateBid(c *gin.Context) {
	var req BidRequest
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
	
	// Check if user is a freelancer
	if currentUser.Role != "freelancer" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only freelancers can place bids"})
		return
	}
	
	// Check if project exists and is open
	var project models.Project
	if err := database.DB.First(&project, req.ProjectID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}
	
	if project.Status != "open" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Project is not open for bidding"})
		return
	}
	
	// Check if user is not the project owner
	if project.ClientID == currentUser.ID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You cannot bid on your own project"})
		return
	}
	
	// Check if user has already bid on this project
	var existingBid models.Bid
	if err := database.DB.Where("project_id = ? AND freelancer_id = ?", req.ProjectID, currentUser.ID).First(&existingBid).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "You have already placed a bid on this project"})
		return
	}
	
	// Validate bid amount is within project budget range
	if req.Amount < project.BudgetMin || req.Amount > project.BudgetMax {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bid amount must be within project budget range"})
		return
	}
	
	bid := models.Bid{
		ProjectID:    req.ProjectID,
		FreelancerID: currentUser.ID,
		Amount:       req.Amount,
		Proposal:     req.Proposal,
		Timeline:     req.Timeline,
		Status:       "pending",
	}
	
	if err := database.DB.Create(&bid).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create bid"})
		return
	}
	
	// Load relationships
	database.DB.Preload("Project").Preload("Freelancer").First(&bid, bid.ID)
	
	c.JSON(http.StatusCreated, gin.H{"bid": bid})
}

func GetProjectBids(c *gin.Context) {
	projectID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}
	
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	
	currentUser := user.(models.User)
	
	// Check if user owns the project
	var project models.Project
	if err := database.DB.First(&project, projectID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}
	
	if project.ClientID != currentUser.ID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only view bids for your own projects"})
		return
	}
	
	var bids []models.Bid
	if err := database.DB.Preload("Freelancer").Where("project_id = ?", projectID).Order("created_at DESC").Find(&bids).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch bids"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"bids": bids})
}

// UpdateProjectStatus allows clients to update their project status (e.g., close project)
func UpdateProjectStatus(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	var req struct {
		Status string `json:"status" binding:"required"`
	}
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

	var project models.Project
	if err := database.DB.First(&project, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}

	// Check if user owns the project
	if project.ClientID != currentUser.ID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only update your own projects"})
		return
	}

	// Validate status
	validStatuses := []string{"open", "in_progress", "completed", "cancelled"}
	isValidStatus := false
	for _, validStatus := range validStatuses {
		if req.Status == validStatus {
			isValidStatus = true
			break
		}
	}

	if !isValidStatus {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status. Valid statuses are: open, in_progress, completed, cancelled"})
		return
	}

	// Update project status
	project.Status = req.Status
	if err := database.DB.Save(&project).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update project status"})
		return
	}

	// Load relationships
	database.DB.Preload("Client").Preload("Freelancer").First(&project, project.ID)

	c.JSON(http.StatusOK, gin.H{"project": project})
} 