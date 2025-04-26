package db

import (
	"context"
	"errors"
	"fmt"
	"image-processing-service/internal/models"
	"github.com/jackc/pgx/v4"
	"os"
)

// GetUserByEmail retrieves a user by their email from the database
func GetUserByEmail(email string) (models.User, error) {
	var user models.User
	conn, err := connectToDB()
	if err != nil {
		return user, err
	}
	defer conn.Close(context.Background())

	query := "SELECT id, email, password FROM users WHERE email = $1"
	err = conn.QueryRow(context.Background(), query, email).Scan(&user.ID, &user.Email, &user.Password)
	if err != nil {
		if err == pgx.ErrNoRows {
			return user, errors.New("user not found")
		}
		return user, err
	}
	return user, nil
}

// CreateUser inserts a new user into the database and returns the generated ID
func CreateUser(user models.User) (string, error) {
	conn, err := connectToDB()
	if err != nil {
		return "", err
	}
	defer conn.Close(context.Background())

	var userID string
	query := "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id"
	err = conn.QueryRow(context.Background(), query, user.Email, user.Password).Scan(&userID)
	if err != nil {
		return "", err
	}
	return userID, nil
}

// GetUserByID retrieves a user by their ID from the database
func GetUserByID(userID string) (models.User, error) {
	var user models.User
	conn, err := connectToDB()
	if err != nil {
		return user, err
	}
	defer conn.Close(context.Background())

	query := "SELECT id, email FROM users WHERE id = $1"
	err = conn.QueryRow(context.Background(), query, userID).Scan(&user.ID, &user.Email)
	if err != nil {
		if err == pgx.ErrNoRows {
			return user, errors.New("user not found")
		}
		return user, err
	}
	return user, nil
}

// GetUserImages retrieves all images for a specific user
func GetUserImages(userID string) ([]models.ImageMeta, error) {
	var images []models.ImageMeta
	conn, err := connectToDB()
	if err != nil {
		return images, err
	}
	defer conn.Close(context.Background())

	query := `SELECT id, file_name, url, size, uploaded, content_type, width, height
	          FROM images WHERE user_id = $1 ORDER BY uploaded DESC`

	rows, err := conn.Query(context.Background(), query, userID)
	if err != nil {
		return images, err
	}
	defer rows.Close()

	for rows.Next() {
		var img models.ImageMeta
		err := rows.Scan(&img.ID, &img.FileName, &img.URL, &img.Size,
		                &img.Uploaded, &img.ContentType, &img.Width, &img.Height)
		if err != nil {
			return images, err
		}
		img.UserID = userID
		images = append(images, img)
	}

	if err := rows.Err(); err != nil {
		return images, err
	}

	return images, nil
}

// Connect to the PostgreSQL database
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
