package models

import "time"

// Represents the structure of data expected for the login API
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

// Represents the structure of data expected for the registration API
type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

// Represents a user entity, which will be stored in the database
type User struct {
	ID                string     `json:"id"`
	Email             string     `json:"email"`
	Password          string     `json:"password,omitempty"`
	Verified          bool       `json:"verified"`
	VerificationToken string     `json:"verification_token,omitempty"`
	VerificationExpiry *time.Time `json:"verification_expiry,omitempty"`
}

// Represents the structure of data returned for verification requests
type VerificationResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

// Represents a request to verify an email
type EmailVerificationRequest struct {
	Token string `json:"token" binding:"required"`
}

// Represents a request to resend verification email
type ResendVerificationRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// Represents metadata for an image
type ImageMeta struct {
	ID           string    `json:"id"`            // Unique identifier for the image
	FileName     string    `json:"file_name"`     // Original file name
	URL          string    `json:"url"`           // URL to original image
	S3Key        string    `json:"s3_key"`        // S3 key for the original image
	Size         int64     `json:"size"`          // Size of the image in bytes
	Uploaded     time.Time `json:"uploaded"` 	  // Timestamp when the image was uploaded
	ContentType  string    `json:"content_type"`  // MIME type of the image
	Width        int       `json:"width"` 		  // Width of the image in pixels
	Height       int       `json:"height"`        // Height of the image in pixels
	UserID       string    `json:"user_id"`       // ID of the user who uploaded the image
	Status       string    `json:"status"`        // pending, processing, completed, failed
	ProcessedURL string    `json:"processed_url"` // URL to processed image (if completed)
}

// Represents a request to reset a password
type ForgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// Represents a request to verify a reset token
type VerifyResetTokenRequest struct {
	Token string `json:"token" binding:"required"`
}

// Represents a request to set a new password with a token
type ResetPasswordRequest struct {
	Token       string `json:"token" binding:"required"`
	NewPassword string `json:"new_password" binding:"required"`
}
