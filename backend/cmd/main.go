package main

import (
	"log"
	"os"

	"freelance-platform/internal/database"
	"freelance-platform/internal/handlers"
	"freelance-platform/internal/middleware"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Initialize database
	database.Connect()
	database.Migrate()

	// Setup Gin router
	r := gin.Default()

	// Add middleware
	r.Use(middleware.CORS())
	r.Use(middleware.Logger())

	// Setup routes
	api := r.Group("/api")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/register", handlers.Register)
			auth.POST("/login", handlers.Login)
			auth.POST("/logout", handlers.Logout)
			auth.GET("/me", middleware.RequireAuth(), handlers.GetCurrentUser)
			auth.PUT("/profile", middleware.RequireAuth(), handlers.UpdateProfile)
		}

		projects := api.Group("/projects")
		{
			projects.GET("", handlers.GetProjects)
			projects.POST("", middleware.RequireAuth(), handlers.CreateProject)
			projects.GET("/:id", handlers.GetProject)
			projects.PUT("/:id", middleware.RequireAuth(), handlers.UpdateProject)
			projects.DELETE("/:id", middleware.RequireAuth(), handlers.DeleteProject)
			projects.GET("/:id/bids", middleware.RequireAuth(), handlers.GetProjectBids)
		}

		bids := api.Group("/bids")
		{
			bids.POST("", middleware.RequireAuth(), handlers.CreateBid)
		}

		chats := api.Group("/chats")
		{
			chats.GET("", middleware.RequireAuth(), handlers.GetChats)
			chats.POST("", middleware.RequireAuth(), handlers.CreateChat)
			chats.GET("/:id/messages", middleware.RequireAuth(), handlers.GetChatMessages)
			chats.PUT("/:id/read", middleware.RequireAuth(), handlers.MarkMessagesAsRead)
			chats.DELETE("/:id", middleware.RequireAuth(), handlers.DeleteChat)
		}

		messages := api.Group("/messages")
		{
			messages.POST("", middleware.RequireAuth(), handlers.SendMessage)
			messages.GET("/unread-count", middleware.RequireAuth(), handlers.GetUnreadCount)
		}
	}

	// Start server
	port := os.Getenv("API_PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	r.Run(":" + port)
} 