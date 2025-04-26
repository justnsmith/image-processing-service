package db

import (
	"context"
	"errors"
	"image-processing-service/internal/models"

	"github.com/jackc/pgx/v4"
)

// GetUserByEmail retrieves a user by their email from the database
func GetUserByEmail(email string) (models.User, error) {
	var user models.User

	pool, err := GetDBPool()
	if err != nil {
		return user, err
	}

	query := "SELECT id, email, password FROM users WHERE email = $1"
	err = pool.QueryRow(context.Background(), query, email).Scan(&user.ID, &user.Email, &user.Password)
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
	pool, err := GetDBPool()
	if err != nil {
		return "", err
	}

	var userID string
	query := "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id"
	err = pool.QueryRow(context.Background(), query, user.Email, user.Password).Scan(&userID)
	if err != nil {
		return "", err
	}
	return userID, nil
}

// GetUserByID retrieves a user by their ID from the database
func GetUserByID(userID string) (models.User, error) {
	var user models.User

	pool, err := GetDBPool()
	if err != nil {
		return user, err
	}

	query := "SELECT id, email FROM users WHERE id = $1"
	err = pool.QueryRow(context.Background(), query, userID).Scan(&user.ID, &user.Email)
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

	pool, err := GetDBPool()
	if err != nil {
		return images, err
	}

	query := `SELECT id, file_name, url, s3_key, size, uploaded, content_type, width, height, status, processed_url
	          FROM images WHERE user_id = $1 ORDER BY uploaded DESC`

	rows, err := pool.Query(context.Background(), query, userID)
	if err != nil {
		return images, err
	}
	defer rows.Close()

	for rows.Next() {
		var img models.ImageMeta
		err := rows.Scan(
			&img.ID,
			&img.FileName,
			&img.URL,
			&img.S3Key,
			&img.Size,
			&img.Uploaded,
			&img.ContentType,
			&img.Width,
			&img.Height,
			&img.Status,
			&img.ProcessedURL,
		)
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

// VerifyImageOwnership checks if an image belongs to a specific user
func VerifyImageOwnership(imageID string, userID string) (bool, error) {
	var count int

	pool, err := GetDBPool()
	if err != nil {
		return false, err
	}

	err = pool.QueryRow(context.Background(),
		`SELECT COUNT(*) FROM images WHERE id = $1 AND user_id = $2`,
		imageID, userID,
	).Scan(&count)

	if err != nil {
		return false, err
	}

	return count > 0, nil
}
