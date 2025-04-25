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
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization token missing or invalid"})
			c.Abort()
			return
		}

		// Extract the token and validate it
		token := authHeader[7:]
		userID, err := auth.ValidateJWT(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		c.Set("userID", userID)

		c.Next()
	}
}
