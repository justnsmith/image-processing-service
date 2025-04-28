package auth

import (
	"crypto/rand"
	"encoding/base64"
	"time"
)

// GenerateToken creates a random token for email verification.
// Generates a secure random byte slice and encodes it as a URL-safe base64 string.
func GenerateToken() (string, error) {
	b := make([]byte, 32)
	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

// GenerateVerificationData creates token and expiry for email verification.
// The generated token is used for identifying the user, and the expiry is set to 24 hrs.
// Returns the generated token, its expiry time, and any errors that were encountered.
func GenerateVerificationData() (string, time.Time, error) {
	token, err := GenerateToken()
	if err != nil {
		return "", time.Time{}, err
	}

	// Set expiry to 24 hours from now
	expiry := time.Now().Add(24 * time.Hour)

	return token, expiry, nil
}
