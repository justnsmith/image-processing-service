package main

import (
	"context"
	"image-processing-service/internal/db"
	"image-processing-service/internal/handler"
	"image-processing-service/internal/worker"
	"log"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

// Initalizes a periodic cleanup task to remove unverified accounts older than 48 hours.
func scheduleCleanupTasks(ctx context.Context) {
	ticker := time.NewTicker(24 * time.Hour)
	go func() {
		for {
			select {
			case <-ticker.C:
				count, err := db.CleanupUnverifiedAccounts(ctx, 48*time.Hour)
				if err != nil {
					log.Printf("Error cleaning up unverified accounts: %v\n", err)
				} else {
					log.Printf("Cleaned up %d unverified accounts\n", count)
				}
			case <-ctx.Done(): // Stop cleanup when shutting down
				log.Println("Cleanup scheduler stopping due to context cancellation")
				ticker.Stop()
				return
			}
		}
	}()
}

func main() {
	// Create a cancelable context for graceful shutdown for all goroutines
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Set up signal catching for graceful shutdown
	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		<-sigs
		log.Println("Shutdown signal received")
		cancel()                    // Cancel context to notify all goroutines
		time.Sleep(3 * time.Second) // Give processes time to clean up
		os.Exit(0)
	}()

	// Load environment variables from .env file
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, proceeding with environment variables")
	}

	// Initialize database connection pool
	pool, err := db.GetDBPool()
	if err != nil {
		log.Fatalf("DB connection error: %v", err)
	}
	defer db.CloseDBPool()

	// Verify database connection
	err = pool.Ping(context.Background())
	if err != nil {
		log.Fatalf("DB ping error: %v", err)
	}
	log.Println("Connected to Postgres")

	// Initialize database tables if needed
	err = db.InitDB()
	if err != nil {
		log.Printf("Warning: Database initialization error: %v", err)
	}

	// Start worker in a separate Go routine to handle background tasks
	go worker.StartWorker(ctx)

	// Start the cleanup scheduler
	scheduleCleanupTasks(ctx)

	// Get current working directory for absolute paths
	currentDir, err := os.Getwd()
	if err != nil {
		log.Printf("Warning: Unable to get current working directory: %v", err)
		currentDir = "."
	}

	// Set up Gin router with default middleware
	router := gin.Default()

	// Enable CORS middleware with custom configuration
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Serve static files for frontend assets
	router.Static("/assets", "./frontend/dist/assets")
	router.Static("/static", "./frontend/dist")
	router.StaticFile("/favicon.ico", "./frontend/dist/ips.png")

	// Add absolute path route that was working
	absDistPath := filepath.Join(currentDir, "frontend/dist")
	router.Static("/abs-static", absDistPath)

	// Root route to serve the frontend SPA (single-page application)
	router.GET("/", func(c *gin.Context) {
		// Check if file exists
		if _, err := os.Stat("./frontend/dist/index.html"); os.IsNotExist(err) {
			log.Println("ERROR: Frontend file ./frontend/dist/index.html not found!")
			c.String(404, "Frontend files not found. Build may be incomplete.")
			return
		}
		c.File("./frontend/dist/index.html")
	})

	// Public routes for user authentication
	router.POST("/login", handler.LoginHandler)
	router.POST("/register", handler.RegisterHandler)

	// Email verification routes
	router.POST("/verify-email", handler.VerifyEmailHandler)
	router.POST("/resend-verification", handler.ResendVerificationHandler)

	// New Password reset routes
	router.POST("/forgot-password", handler.ForgotPasswordHandler)
	router.POST("/verify-reset-token", handler.VerifyResetTokenHandler)
	router.POST("/reset-password", handler.ResetPasswordHandler)

	// Protected routes with JWT middleware
	authorized := router.Group("/")
	authorized.Use(handler.AuthMiddleware())
	{
		// User profile routes
		authorized.GET("/profile", handler.GetUserProfileHandler)
		authorized.GET("/images", handler.GetUserImagesHandler)

		// Add new image count endpoint
		authorized.GET("/images/count", handler.GetUserImageCountHandler)

		// Image status endpoint
		authorized.GET("/images/:id/status", handler.GetImageStatusHandler)

		// Route to upload image
		authorized.POST("/upload", func(c *gin.Context) {
			// Get userID from the JWT token in the context
			userID, exists := c.Get("userID")
			if !exists {
				c.JSON(400, gin.H{"error": "UserID not found in context"})
				return
			}
			// Handle the image upload
			handler.UploadImageHandler(c, userID.(string))
		})

		// Delete image endpoint
		authorized.DELETE("/images/:id", handler.DeleteImageHandler)
	}

	// Catch-all for SPA routing
	router.NoRoute(func(c *gin.Context) {
		c.File("./frontend/dist/index.html")
	})

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
