package main

import (
	"context"
	"fmt"
	"log"

	"os"

	"image-processing-service/internal/handler"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v4"
	"github.com/joho/godotenv"
)

var db *pgx.Conn

func main() {
	// Load .env file
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, proceeding with environment variables")
	}

	// Set up PostgreSQL connection
	db, err = connectToDB()
	if err != nil {
		log.Fatalf("DB connect error: %v", err)
	}
	defer db.Close(context.Background())
	log.Println("Connected to Postgres")

	// Set up Gin
	router := gin.Default()

	// Routes
	router.POST("/upload", func(c *gin.Context) {
		handler.UploadImageHandler(c, db)
	})

	// Start server
	log.Println("Server started on :8080")
	err = router.Run(":8080")
	if err != nil {
		log.Fatalf("Gin server error: %v", err)
	}
}

func connectToDB() (*pgx.Conn, error) {
	user := os.Getenv("POSTGRES_USER")
	password := os.Getenv("POSTGRES_PASSWORD")
	dbname := os.Getenv("POSTGRES_DB")
	host := os.Getenv("POSTGRES_HOST")
	port := os.Getenv("POSTGRES_PORT")
	sslmode := os.Getenv("POSTGRES_SSLMODE")

	dsn := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s",
		user, password, host, port, dbname, sslmode,
	)

	conn, err := pgx.Connect(context.Background(), dsn)
	if err != nil {
		return nil, err
	}
	return conn, nil
}
