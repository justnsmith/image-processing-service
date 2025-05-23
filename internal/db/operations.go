package db

import (
	"context"
	"errors"
	"fmt"
	"image-processing-service/internal/auth"
	"image-processing-service/internal/models"
	"time"

	"github.com/jackc/pgx/v4"
	"golang.org/x/crypto/bcrypt"
)

// Creates a new user with verification token and returns the user ID
func CreateUser(user models.User) (string, error) {
	pool, err := GetDBPool()
	if err != nil {
		return "", err
	}

	var userID string
	err = pool.QueryRow(context.Background(),
		`INSERT INTO users (email, password, verified, verification_token, verification_expiry)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id`,
		user.Email, user.Password, user.Verified, user.VerificationToken, user.VerificationExpiry,
	).Scan(&userID)

	return userID, err
}

// Retrieves a user by email address
func GetUserByEmail(email string) (models.User, error) {
	pool, err := GetDBPool()
	if err != nil {
		return models.User{}, err
	}

	var user models.User

	// Step 1: Get the core user info first (guaranteed non-null fields)
	err = pool.QueryRow(context.Background(),
		`SELECT id, email, password, verified FROM users WHERE LOWER(email) = LOWER($1)`,
		email,
	).Scan(&user.ID, &user.Email, &user.Password, &user.Verified)

	if err != nil {
		fmt.Printf("Login error: %v\n", err)
		return models.User{}, err
	}

	// Step 2: If verification fields might be null, query them separately
	// and handle any errors silently
	var verificationToken string
	var verificationExpiry time.Time

	err = pool.QueryRow(context.Background(),
		`SELECT verification_token, verification_expiry
         FROM users WHERE id = $1 AND verification_token IS NOT NULL`,
		user.ID,
	).Scan(&verificationToken, &verificationExpiry)

	// Only set if we got results back (no error)
	if err == nil {
		user.VerificationToken = verificationToken
		user.VerificationExpiry = &verificationExpiry
	}

	return user, nil
}

// Retrieves a user by their unique user ID
func GetUserByID(userID string) (models.User, error) {
	pool, err := GetDBPool()
	if err != nil {
		return models.User{}, err
	}

	var user models.User
	err = pool.QueryRow(context.Background(),
		`SELECT id, email, verified FROM users WHERE id = $1`,
		userID,
	).Scan(&user.ID, &user.Email, &user.Verified)

	return user, err
}

// Verifies a user's email with the provided token
func VerifyUserEmail(token string) (string, error) {
	fmt.Printf("Attempting to verify token: %s\n", token)

	ctx := context.Background()
	pool, err := GetDBPool()
	if err != nil {
		return "", fmt.Errorf("failed to get database pool: %v", err)
	}
	conn, err := pool.Acquire(ctx)
	if err != nil {
		return "", fmt.Errorf("failed to acquire connection: %v", err)
	}
	defer conn.Release()

	tx, err := conn.Begin(ctx)
	if err != nil {
		return "", fmt.Errorf("failed to begin transaction: %v", err)
	}
	defer tx.Rollback(ctx)

	// First get the user with the matching token
	var userID string
	var expiry time.Time

	err = tx.QueryRow(ctx, `
		SELECT id, verification_expiry
		FROM users
		WHERE verification_token = $1 AND verified = false
	`, token).Scan(&userID, &expiry)

	if err != nil {
		if err == pgx.ErrNoRows {
			return "", fmt.Errorf("invalid or expired verification token")
		}
		return "", fmt.Errorf("database error: %v", err)
	}

	fmt.Printf("Found user with ID: %s, expiry: %v\n", userID, expiry)

	// Check if token has expired
	if time.Now().After(expiry) {
		return "", fmt.Errorf("verification token has expired")
	}

	// Update the user's verified status
	_, err = tx.Exec(ctx, `
		UPDATE users
		SET verified = true,
		    verification_token = NULL,
		    verification_expiry = NULL
		WHERE id = $1
	`, userID)

	if err != nil {
		return "", fmt.Errorf("failed to update user verification status: %v", err)
	}

	// Commit the transaction
	if err = tx.Commit(ctx); err != nil {
		return "", fmt.Errorf("failed to commit transaction: %v", err)
	}

	fmt.Printf("Successfully verified email for user ID: %s\n", userID)
	return userID, nil
}

// Updates a user's verification token and its expiry
func UpdateVerificationToken(email string, token string, expiry time.Time) error {
	pool, err := GetDBPool()
	if err != nil {
		return err
	}

	result, err := pool.Exec(context.Background(),
		`UPDATE users SET verification_token = $1, verification_expiry = $2
		WHERE email = $3 AND verified = false`,
		token, expiry, email,
	)

	if err != nil {
		return err
	}

	rowsAffected := result.RowsAffected()
	if rowsAffected == 0 {
		return errors.New("user not found or already verified")
	}

	return nil
}

// Inserts image metadata and returns the generated image ID
func InsertImageMeta(ctx context.Context, meta models.ImageMeta) (string, error) {
	pool, err := GetDBPool()
	if err != nil {
		return "", err
	}
	var imageID string
	err = pool.QueryRow(ctx,
		`INSERT INTO images (file_name, url, s3_key, size, uploaded, content_type, width, height, user_id, status, processed_url)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id`,
		meta.FileName, meta.URL, meta.S3Key, meta.Size, meta.Uploaded, meta.ContentType,
		meta.Width, meta.Height, meta.UserID, meta.Status, meta.ProcessedURL,
	).Scan(&imageID)
	return imageID, err
}

// Updates the status and optionally the processed URL for an image
func UpdateImageStatus(ctx context.Context, imageID string, status string, processedURL string) error {
	pool, err := GetDBPool()
	if err != nil {
		return err
	}
	_, err = pool.Exec(ctx,
		`UPDATE images SET status = $1, processed_url = $2 WHERE id = $3`,
		status, processedURL, imageID,
	)
	return err
}

// Retrieves the current status and processed URL of an image
func GetImageStatus(ctx context.Context, imageID string) (string, string, error) {
	pool, err := GetDBPool()
	if err != nil {
		return "", "", err
	}
	var status, processedURL string
	err = pool.QueryRow(ctx,
		`SELECT status, processed_url FROM images WHERE id = $1`,
		imageID,
	).Scan(&status, &processedURL)
	return status, processedURL, err
}

// Retrievs image metadata based on the filename
func GetImageMetaByFileName(ctx context.Context, fileName string) (models.ImageMeta, error) {
	var meta models.ImageMeta
	pool, err := GetDBPool()
	if err != nil {
		return meta, err
	}
	err = pool.QueryRow(ctx,
		`SELECT file_name, url, size, uploaded, content_type, width, height, user_id
		 FROM images WHERE file_name = $1 ORDER BY uploaded DESC LIMIT 1`,
		fileName).Scan(
		&meta.FileName, &meta.URL, &meta.Size, &meta.Uploaded,
		&meta.ContentType, &meta.Width, &meta.Height, &meta.UserID,
	)
	return meta, err
}

// Deletes an image from the database after verifying ownership
func DeleteImage(imageID string, userID string) error {
	pool, err := GetDBPool()
	if err != nil {
		return err
	}
	// First, verify the image belongs to the user
	var exists bool
	err = pool.QueryRow(context.Background(),
		"SELECT EXISTS(SELECT 1 FROM images WHERE id = $1 AND user_id = $2)",
		imageID, userID).Scan(&exists)
	if err != nil {
		return err
	}
	if !exists {
		return errors.New("image not found or does not belong to the user")
	}
	// Delete the image
	_, err = pool.Exec(context.Background(),
		"DELETE FROM images WHERE id = $1 AND user_id = $2",
		imageID, userID)
	return err
}

// Verifies that an image belongs to a user
func VerifyImageOwnership(imageID string, userID string) (bool, error) {
	pool, err := GetDBPool()
	if err != nil {
		return false, err
	}
	var exists bool
	err = pool.QueryRow(context.Background(),
		"SELECT EXISTS(SELECT 1 FROM images WHERE id = $1 AND user_id = $2)",
		imageID, userID).Scan(&exists)
	return exists, err
}

// Retrieves all images by a specific user
func GetUserImages(userID string) ([]models.ImageMeta, error) {
	pool, err := GetDBPool()
	if err != nil {
		return nil, err
	}

	rows, err := pool.Query(context.Background(),
		`SELECT id, file_name, url, s3_key, size, uploaded, content_type, width, height,
		status, processed_url FROM images WHERE user_id = $1 ORDER BY uploaded DESC`,
		userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var images []models.ImageMeta
	for rows.Next() {
		var image models.ImageMeta
		err = rows.Scan(
			&image.ID, &image.FileName, &image.URL, &image.S3Key, &image.Size,
			&image.Uploaded, &image.ContentType, &image.Width, &image.Height,
			&image.Status, &image.ProcessedURL)
		if err != nil {
			return nil, err
		}
		image.UserID = userID
		images = append(images, image)
	}

	return images, nil
}

// Generates a reset token for a user and saves it to the database
func CreatePasswordResetToken(email string) (string, error) {
	pool, err := GetDBPool()
	if err != nil {
		return "", err
	}

	// Generate token and expiry
	token, err := auth.GenerateToken()
	if err != nil {
		return "", err
	}

	// Set expiry to 1 hour from now
	expiry := time.Now().Add(1 * time.Hour)

	// Update user with reset token
	result, err := pool.Exec(context.Background(),
		`UPDATE users SET reset_token = $1, reset_token_expiry = $2
		WHERE LOWER(email) = LOWER($3)`,
		token, expiry, email,
	)

	if err != nil {
		return "", err
	}

	rowsAffected := result.RowsAffected()
	if rowsAffected == 0 {
		return "", errors.New("user not found")
	}

	return token, nil
}

// Checks if a reset token is valid and has not expired, will return users email.
func VerifyResetToken(token string) (string, error) {
	pool, err := GetDBPool()
	if err != nil {
		return "", err
	}

	var email string
	var expiry time.Time

	err = pool.QueryRow(context.Background(),
		`SELECT email, reset_token_expiry
		FROM users
		WHERE reset_token = $1`,
		token,
	).Scan(&email, &expiry)

	if err != nil {
		if err == pgx.ErrNoRows {
			return "", errors.New("invalid or expired reset token")
		}
		return "", err
	}

	// Check if token has expired
	if time.Now().After(expiry) {
		return "", errors.New("reset token has expired")
	}

	return email, nil
}

// Updates a user's password and clears the reset token from the database
func UpdatePassword(email string, newPassword string) error {
	pool, err := GetDBPool()
	if err != nil {
		return err
	}

	// Hash the new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	_, err = pool.Exec(context.Background(),
		`UPDATE users SET
		    password = $1,
		    reset_token = NULL,
		    reset_token_expiry = NULL
		WHERE LOWER(email) = LOWER($2)`,
		string(hashedPassword), email,
	)

	return err
}

// Retrievs the total number of images associated with a user
func GetUserImageCount(userID string) (int, error) {
	pool, err := GetDBPool()
	if err != nil {
		return 0, err
	}

	var count int
	err = pool.QueryRow(context.Background(),
		`SELECT COUNT(*) FROM images WHERE user_id = $1`,
		userID).Scan(&count)

	return count, err
}
