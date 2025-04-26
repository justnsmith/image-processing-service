package handler

import (
	"net/http"
	"regexp"
	"golang.org/x/crypto/bcrypt"
	"github.com/gin-gonic/gin"
	"image-processing-service/internal/auth"
	"image-processing-service/internal/models"
	"image-processing-service/internal/db"
)

// LoginHandler handles login requests
func LoginHandler(c *gin.Context) {
    var loginRequest models.LoginRequest
    if err := c.ShouldBindJSON(&loginRequest); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
        return
    }

    // Check credentials
    user, err := db.GetUserByEmail(loginRequest.Email)
    if err != nil {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
        return
    }

    // Verify password
    if !auth.CheckPassword(user.Password, loginRequest.Password) {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
        return
    }

    // Generate JWT for the user
    token, err := auth.GenerateJWT(user.ID)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not generate token"})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "token": token,
        "user_id": user.ID,
        "email": user.Email,
    })
}

// RegisterHandler handles registration requests
func RegisterHandler(c *gin.Context) {
    var registerRequest models.RegisterRequest
    if err := c.ShouldBindJSON(&registerRequest); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
        return
    }

    // Basic validation
    if !isValidEmail(registerRequest.Email) {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid email format"})
        return
    }

    if len(registerRequest.Password) < 8 {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Password must be at least 8 characters"})
        return
    }

    // Check if user already exists
    _, err := db.GetUserByEmail(registerRequest.Email)
    if err == nil {
        // User exists
        c.JSON(http.StatusConflict, gin.H{"error": "Email already registered"})
        return
    }

    // Hash the password before storing it in the database
    hashedPassword, err := bcrypt.GenerateFromPassword([]byte(registerRequest.Password), bcrypt.DefaultCost)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not hash password"})
        return
    }

    // Create a new user in the database
    user := models.User{
        Email:    registerRequest.Email,
        Password: string(hashedPassword), // Store the hashed password
    }

    // Insert user into the DB
    userID, err := db.CreateUser(user)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not register user"})
        return
    }

    // Generate JWT for automatic login after registration
    token, err := auth.GenerateJWT(userID)
    if err != nil {
        c.JSON(http.StatusOK, gin.H{"message": "Registration successful, but could not generate token"})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "message": "Registration successful",
        "token": token,
        "user_id": userID,
    })
}

// Helper function to validate email format
func isValidEmail(email string) bool {
    emailRegex := regexp.MustCompile(`^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,4}$`)
    return emailRegex.MatchString(email)
}

func GetUserProfileHandler(c *gin.Context) {
	// Get userID from the JWT token in the context
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get user details from database
	user, err := db.GetUserByID(userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve user profile"})
		return
	}

	// Return user profile
	c.JSON(http.StatusOK, gin.H{
		"id":    user.ID,
		"email": user.Email,
	})
}

// GetUserImagesHandler retrieves all images for the authenticated user
func GetUserImagesHandler(c *gin.Context) {
	// Get userID from the JWT token in the context
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get user images from database
	images, err := db.GetUserImages(userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve user images"})
		return
	}

	// Return user images
	c.JSON(http.StatusOK, gin.H{
		"images": images,
	})
}
