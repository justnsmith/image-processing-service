package db

import (
	"context"
	"errors"
	"image-processing-service/internal/models"
)

// InsertImageMeta inserts image metadata and returns the generated ID
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

// UpdateImageStatus updates the status and optionally the processed URL for an image
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

// GetImageStatus retrieves the status of an image
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

// GetImageMetaByFileName retrieves image metadata from the database by filename
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

// DeleteImage deletes an image from the database
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
