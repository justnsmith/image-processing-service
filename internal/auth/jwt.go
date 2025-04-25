package auth

import (
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// Load the secret key from the .env file
var secretKey []byte = []byte(os.Getenv("JWS_SECRET"))

// GenerateJWT generates a new JWT token for the user.
func GenerateJWT(userID string) (string, error) {
	// Create the JWT claims
	claims := &jwt.RegisteredClaims{
		Subject:   userID, // user ID to associate with the JWT
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)), // Token expiration time
		IssuedAt:  jwt.NewNumericDate(time.Now()),
	}

	// Create the token with signing method and claims
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign the token with our secret key
	tokenString, err := token.SignedString(secretKey)
	if err != nil {
		return "", fmt.Errorf("failed to sign token: %v", err)
	}

	return tokenString, nil
}

// ValidateJWT validates the JWT token and returns the userID if valid.
func ValidateJWT(tokenString string) (string, error) {
	// Parse the token with claims
	token, err := jwt.ParseWithClaims(tokenString, &jwt.RegisteredClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Ensure the token's signing method matches the expected method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return secretKey, nil
	})

	if err != nil || !token.Valid {
		return "", fmt.Errorf("invalid token: %v", err)
	}

	// Extract and return the user ID from the claims
	claims, ok := token.Claims.(*jwt.RegisteredClaims)
	if !ok {
		return "", fmt.Errorf("could not parse claims")
	}

	return claims.Subject, nil
}

func CheckPassword(hashedPassword, password string) bool {
	// Compare the hashed password with the given password
	err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
	return err == nil
}
