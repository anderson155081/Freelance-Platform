package main

import (
	"log"

	"freelance-platform/internal/database"
	"freelance-platform/internal/models"

	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Connect to database
	database.Connect()

	log.Println("Seeding database with sample data...")

	// Create sample users
	createSampleUsers()
	createSampleProjects()

	log.Println("Database seeding completed successfully!")
}

func createSampleUsers() {
	// Hash password for sample users
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)

	users := []models.User{
		{
			Email:    "client@example.com",
			Password: string(hashedPassword),
			Name:     "John Client",
			Role:     "client",
			Bio:      "I'm a business owner looking for talented freelancers.",
		},
		{
			Email:    "freelancer@example.com",
			Password: string(hashedPassword),
			Name:     "Jane Freelancer",
			Role:     "freelancer",
			Bio:      "Full-stack developer with 5 years of experience.",
			Skills:   `["React", "Node.js", "PostgreSQL", "TypeScript"]`,
			Rating:   4.8,
		},
		{
			Email:    "admin@example.com",
			Password: string(hashedPassword),
			Name:     "Admin User",
			Role:     "admin",
			Bio:      "Platform administrator.",
		},
	}

	for _, user := range users {
		var existingUser models.User
		if err := database.DB.Where("email = ?", user.Email).First(&existingUser).Error; err != nil {
			// User doesn't exist, create it
			if err := database.DB.Create(&user).Error; err != nil {
				log.Printf("Failed to create user %s: %v", user.Email, err)
			} else {
				log.Printf("Created user: %s", user.Email)
			}
		} else {
			log.Printf("User already exists: %s", user.Email)
		}
	}
}

func createSampleProjects() {
	// Get the client user
	var client models.User
	if err := database.DB.Where("email = ?", "client@example.com").First(&client).Error; err != nil {
		log.Println("Client user not found, skipping project creation")
		return
	}

	projects := []models.Project{
		{
			Title:       "E-commerce Website Development",
			Description: "Need a modern e-commerce website built with React and Node.js. Should include user authentication, product catalog, shopping cart, and payment integration.",
			Budget:      2500.00,
			Currency:    "USD",
			Category:    "Web Development",
			Skills:      `["React", "Node.js", "PostgreSQL", "Stripe"]`,
			ClientID:    client.ID,
			Status:      "open",
		},
		{
			Title:       "Mobile App UI/UX Design",
			Description: "Looking for a talented designer to create modern and intuitive UI/UX for our mobile application. Need wireframes, mockups, and prototypes.",
			Budget:      1500.00,
			Currency:    "USD",
			Category:    "Design",
			Skills:      `["Figma", "UI/UX Design", "Mobile Design", "Prototyping"]`,
			ClientID:    client.ID,
			Status:      "open",
		},
		{
			Title:       "API Development and Documentation",
			Description: "Need to develop RESTful APIs for our platform and create comprehensive documentation. Should include authentication, rate limiting, and proper error handling.",
			Budget:      3000.00,
			Currency:    "USD",
			Category:    "Backend Development",
			Skills:      `["Go", "REST API", "PostgreSQL", "Docker"]`,
			ClientID:    client.ID,
			Status:      "open",
		},
	}

	for _, project := range projects {
		var existingProject models.Project
		if err := database.DB.Where("title = ? AND client_id = ?", project.Title, project.ClientID).First(&existingProject).Error; err != nil {
			// Project doesn't exist, create it
			if err := database.DB.Create(&project).Error; err != nil {
				log.Printf("Failed to create project %s: %v", project.Title, err)
			} else {
				log.Printf("Created project: %s", project.Title)
			}
		} else {
			log.Printf("Project already exists: %s", project.Title)
		}
	}
} 