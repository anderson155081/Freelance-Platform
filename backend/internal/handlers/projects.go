package handlers

import (
	"net/http"
	"strconv"

	"freelance-platform/internal/database"
	"freelance-platform/internal/models"

	"github.com/gin-gonic/gin"
)

type ProjectRequest struct {
	Title       string  `json:"title" binding:"required"`
	Description string  `json:"description"`
	Budget      float64 `json:"budget" binding:"required,gt=0"`
	Currency    string  `json:"currency"`
	Category    string  `json:"category" binding:"required"`
	Skills      string  `json:"skills"`
}

func GetProjects(c *gin.Context) {
	var projects []models.Project
	
	query := database.DB.Preload("Client").Preload("Freelancer")
	
	// Add filters
	if category := c.Query("category"); category != "" {
		query = query.Where("category = ?", category)
	}
	
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	
	// Pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit
	
	if err := query.Offset(offset).Limit(limit).Find(&projects).Error; err != nil {
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
	
	project := models.Project{
		Title:       req.Title,
		Description: req.Description,
		Budget:      req.Budget,
		Currency:    req.Currency,
		Category:    req.Category,
		Skills:      req.Skills,
		ClientID:    currentUser.ID,
		Status:      "open",
	}
	
	if project.Currency == "" {
		project.Currency = "USD"
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
	
	// Update project
	project.Title = req.Title
	project.Description = req.Description
	project.Budget = req.Budget
	if req.Currency != "" {
		project.Currency = req.Currency
	}
	project.Category = req.Category
	project.Skills = req.Skills
	
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
	
	if err := database.DB.Delete(&project).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete project"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "Project deleted successfully"})
} 