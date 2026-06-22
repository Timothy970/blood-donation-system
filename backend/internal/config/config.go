package config

import (
	"fmt"
	"log"
	"os"
	"time"

	"blood-donation-system/backend/internal/models"

	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// Config holds global configurations.
type Config struct {
	Port         string
	DatabaseURL  string
	JWTSecret    string
}

var (
	// DB is the global gorm database reference.
	DB     *gorm.DB
	// GlobalConfig holds the environment config values.
	GlobalConfig *Config
)

// LoadConfig reads settings from .env file or environment variables.
func LoadConfig() {
	// Attempt to load .env file; ignore error if it doesn't exist (e.g. in production)
	_ = godotenv.Load()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		// Provide default local fallback
		dbURL = "host=localhost user=postgres password=postgres dbname=blood_donation port=5432 sslmode=disable"
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "super-secret-key-change-in-production"
	}

	GlobalConfig = &Config{
		Port:        port,
		DatabaseURL: dbURL,
		JWTSecret:   jwtSecret,
	}
}

// ConnectDatabase establishes connection to Postgres and migrates schema.
func ConnectDatabase() {
	var err error
	DB, err = gorm.Open(postgres.Open(GlobalConfig.DatabaseURL), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	fmt.Println("Database connection successfully established.")

	// Auto migrate schemas
	err = DB.AutoMigrate(
		&models.User{},
		&models.Profile{},
		&models.BloodRequest{},
		&models.Booking{},
		&models.DonationMade{},
		&models.Chat{},
		&models.Message{},
	)
	if err != nil {
		log.Fatalf("Database auto-migration failed: %v", err)
	}

	fmt.Println("Database schemas auto-migrated successfully.")

	// Auto seed admin account
	var adminCount int64
	DB.Model(&models.User{}).Where("username = ?", "admin").Count(&adminCount)
	if adminCount == 0 {
		fmt.Println("Admin account not found. Seeding default admin ('admin' / 'admin123')...")
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
		if err != nil {
			log.Printf("Failed to hash admin password: %v", err)
			return
		}
		admin := models.User{
			Username:     "admin",
			Email:        "admin@bloodhero.org",
			PasswordHash: string(hashedPassword),
			Role:         "admin",
		}
		if err := DB.Create(&admin).Error; err != nil {
			log.Printf("Failed to seed admin user: %v", err)
			return
		}
		profile := models.Profile{
			UserID:       admin.ID,
			DateOfBirth:  time.Date(1990, 1, 1, 0, 0, 0, 0, time.UTC),
			Availability: "Anyday",
			Gender:       "M",
			BloodType:    "O-",
			City:         "Nairobi",
			PhoneNumber:  "+254700000000",
		}
		if err := DB.Create(&profile).Error; err != nil {
			log.Printf("Failed to seed admin profile: %v", err)
			return
		}
		fmt.Println("Default admin account successfully seeded.")
	}
}
