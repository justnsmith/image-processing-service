package models

import "time"

// LoginRequest represents the structure of data expected for the login API
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

// RegisterRequest represents the structure of data expected for the registration API
type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

// User represents a user entity, which will be stored in the database
type User struct {
	ID       string `json:"id"`
	Email    string `json:"email"`
	Password string `json:"password,omitempty"` // omitempty for JSON responses
}

// ImageMeta represents metadata for an image
type ImageMeta struct {
	ID           string    `json:"id"`
	FileName     string    `json:"file_name"`
	URL          string    `json:"url"`           // URL to original image
	S3Key        string    `json:"s3_key"`        // S3 key for the original image
	Size         int64     `json:"size"`
	Uploaded     time.Time `json:"uploaded"`
	ContentType  string    `json:"content_type"`
	Width        int       `json:"width"`
	Height       int       `json:"height"`
	UserID       string    `json:"user_id"`
	Status       string    `json:"status"`        // pending, processing, completed, failed
	ProcessedURL string    `json:"processed_url"` // URL to processed image (if completed)
}
