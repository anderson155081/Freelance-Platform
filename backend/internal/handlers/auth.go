package handlers

import (
	"net/http"
	"os"
	"strconv"
	"time"

	"freelance-platform/internal/database"
	"freelance-platform/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type AuthRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Name     string `json:"name"`
	Role     string `json:"role"`
}

type UpdateProfileRequest struct {
	Name        string `json:"name"`
	Bio         string `json:"bio"`
	Skills      string `json:"skills"`
	Role        string `json:"role"`
	Profession  string `json:"profession"`
	Experience  string `json:"experience"`
	Portfolio   string `json:"portfolio"`
	HourlyRate  int    `json:"hourly_rate"`
	Available   *bool  `json:"available"` // pointer to distinguish between false and not provided
	City        string `json:"city"`
	Website     string `json:"website"`
	LinkedIn    string `json:"linkedin"`
	GitHub      string `json:"github"`
}

func Register(c *gin.Context) {
	var req AuthRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if user already exists
	var existingUser models.User
	if err := database.DB.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "User with this email already exists"})
		return
	}

	// Validate role
	if req.Role == "" {
		req.Role = "freelancer" // Default to freelancer
	}
	if req.Role != "freelancer" && req.Role != "client" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role. Must be 'freelancer' or 'client'"})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Create user
	user := models.User{
		Email:    req.Email,
		Password: string(hashedPassword),
		Name:     req.Name,
		Role:     req.Role,
	}

	if err := database.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	// Generate JWT token
	token, err := generateJWT(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"user":  user,
		"token": token,
	})
}

func Login(c *gin.Context) {
	var req AuthRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Find user
	var user models.User
	if err := database.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Check password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Generate JWT token
	token, err := generateJWT(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user":  user,
		"token": token,
	})
}

func Logout(c *gin.Context) {
	// In a more complex implementation, you might want to invalidate the token
	// For now, we'll just return success and let the client handle token removal
	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

func GetCurrentUser(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": user})
}

func UpdateProfile(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	currentUser := user.(models.User)

	var req UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate role if provided
	if req.Role != "" && req.Role != "freelancer" && req.Role != "client" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role. Must be 'freelancer' or 'client'"})
		return
	}

	// Update user fields
	updateData := models.User{
		Name:       req.Name,
		Bio:        req.Bio,
		Skills:     req.Skills,
		Profession: req.Profession,
		Experience: req.Experience,
		Portfolio:  req.Portfolio,
		HourlyRate: req.HourlyRate,
		City:       req.City,
		Website:    req.Website,
		LinkedIn:   req.LinkedIn,
		GitHub:     req.GitHub,
	}

	// Update role if provided
	if req.Role != "" {
		updateData.Role = req.Role
	}

	// Update availability if provided
	if req.Available != nil {
		updateData.Available = *req.Available
	}

	// Perform the update
	if err := database.DB.Model(&currentUser).Updates(updateData).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	// Fetch the updated user
	var updatedUser models.User
	if err := database.DB.Where("id = ?", currentUser.ID).First(&updatedUser).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch updated user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": updatedUser})
}

func generateJWT(userID uint) (string, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "your_jwt_secret_key"
	}

	expireHours := os.Getenv("JWT_EXPIRE_HOURS")
	hours := 24 // default
	if expireHours != "" {
		if h, err := strconv.Atoi(expireHours); err == nil {
			hours = h
		}
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(time.Hour * time.Duration(hours)).Unix(),
	})

	return token.SignedString([]byte(secret))
} 