package main

import (
	"context"
	"fmt"
	"image-processing-service/internal/db"
	"image-processing-service/internal/handler"
	"image-processing-service/internal/worker"
	"log"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v4"
	"github.com/joho/godotenv"
)

var dbConn *pgx.Conn

func main() {
	// Load .env file
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, proceeding with environment variables")
	}

	// Set up PostgreSQL connection
	dbConn, err = connectToDB()
	if err != nil {
		log.Fatalf("DB connection error: %v", err)
	}
	defer dbConn.Close(context.Background())
	log.Println("Connected to Postgres")

	// Initialize database tables
	err = db.InitDB()
	if err != nil {
		log.Printf("Warning: Database initialization error: %v", err)
	}

	// Set up Gin
	router := gin.Default()

	// Enable CORS middleware with custom configuration
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://localhost:5173"}, // Update with your frontend URLs
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Public routes for user authentication
	router.POST("/login", handler.LoginHandler)
	router.POST("/register", handler.RegisterHandler)

	// Protected routes with JWT middleware
	authorized := router.Group("/")
	authorized.Use(handler.AuthMiddleware())
	{
		// User profile routes
		authorized.GET("/profile", handler.GetUserProfileHandler)
		authorized.GET("/images", handler.GetUserImagesHandler)

		// Route to upload image
		authorized.POST("/upload", func(c *gin.Context) {
			// Get userID from the JWT token in the context
			userID, exists := c.Get("userID")
			if !exists {
				c.JSON(400, gin.H{"error": "UserID not found in context"})
				return
			}
			// Handle the image upload
			handler.UploadImageHandler(c, dbConn, userID.(string))
		})

		authorized.DELETE("/images/:id", handler.DeleteImageHandler)
	}

	// Start worker in a separate Go routine to handle background tasks
	go worker.StartWorker(context.Background(), dbConn)

	// Start the server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // Default port
	}
	log.Printf("Server started on :%s", port)
	err = router.Run(":" + port)
	if err != nil {
		log.Fatalf("Gin server error: %v", err)
	}
}

// connectToDB establishes a connection to the PostgreSQL database
func connectToDB() (*pgx.Conn, error) {
	user := os.Getenv("POSTGRES_USER")
	password := os.Getenv("POSTGRES_PASSWORD")
	dbname := os.Getenv("POSTGRES_DB")
	host := os.Getenv("POSTGRES_HOST")
	port := os.Getenv("POSTGRES_PORT")
	sslmode := os.Getenv("POSTGRES_SSLMODE")

	// PostgreSQL connection string
	dsn := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s",
		user, password, host, port, dbname, sslmode,
	)

	conn, err := pgx.Connect(context.Background(), dsn)
	if err != nil {
		return nil, err
	}

	// Test the connection
	err = conn.Ping(context.Background())
	if err != nil {
		return nil, err
	}

	return conn, nil
}
