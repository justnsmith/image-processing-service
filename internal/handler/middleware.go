package handler

import (
	"image-processing-service/internal/auth"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// AuthMiddleware checks the JWT token for authentication
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Extract JWT token from Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header missing"})
			c.Abort()
			return
		}

		// Check if the header has the Bearer prefix
		if !strings.HasPrefix(authHeader, "Bearer ") {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization format. Expected 'Bearer TOKEN'"})
			c.Abort()
			return
		}

		// Extract the token and validate it
		token := authHeader[7:] // Skip "Bearer "
		userID, err := auth.ValidateJWT(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		// Set the user ID in the context
		c.Set("userID", userID)
		c.Next()
	}
}
