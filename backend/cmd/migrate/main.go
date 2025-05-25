package main

import (
	"flag"
	"log"

	"freelance-platform/internal/database"
	"freelance-platform/internal/models"

	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Parse command line flags
	reset := flag.Bool("reset", false, "Reset database (drop all tables)")
	flag.Parse()

	// Connect to database
	database.Connect()

	if *reset {
		log.Println("Resetting database...")
		
		// Drop all tables
		database.DB.Migrator().DropTable(
			&models.Message{},
			&models.Chat{},
			&models.Bid{},
			&models.Project{},
			&models.User{},
		)
		
		log.Println("All tables dropped successfully")
	}

	// Run migrations
	log.Println("Running database migrations...")
	database.Migrate()
	
	log.Println("Migration completed successfully!")
} 