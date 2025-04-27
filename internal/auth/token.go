package auth

import (
	"crypto/rand"
	"encoding/base64"
	"time"
)

// GenerateToken creates a random token for email verification
func GenerateToken() (string, error) {
	b := make([]byte, 32)
	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

// GenerateVerificationData creates token and expiry for email verification
func GenerateVerificationData() (string, time.Time, error) {
	token, err := GenerateToken()
	if err != nil {
		return "", time.Time{}, err
	}

	// Set expiry to 24 hours from now
	expiry := time.Now().Add(24 * time.Hour)

	return token, expiry, nil
}
