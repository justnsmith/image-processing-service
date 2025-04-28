package handler

import (
	"context"
	"fmt"
	"image-processing-service/internal/auth"
	"image-processing-service/internal/db"
	"image-processing-service/internal/models"
	"image-processing-service/internal/utils"
	"net/http"
	"regexp"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// LoginHandler handles login requests.
// Verifies the user's email and password, checks if the account is verified,
// and returns a JWT token on successful authentication.
func LoginHandler(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request"})
		return
	}

	fmt.Printf("Login attempt for email: %s\n", req.Email)

	user, err := db.GetUserByEmail(req.Email)
	if err != nil {
		fmt.Printf("Login error: %v\n", err)
		c.JSON(401, gin.H{"error": "Invalid email or password"})
		return
	}

	if !auth.CheckPassword(user.Password, req.Password) {
		fmt.Printf("Password mismatch for user: %s\n", user.Email)
		c.JSON(401, gin.H{"error": "Invalid email or password"})
		return
	}

	if !user.Verified {
		fmt.Printf("User not verified: %s\n", user.Email)
		c.JSON(401, gin.H{"error": "Email not verified"})
		return
	}

	token, err := auth.GenerateJWT(user.ID)
	if err != nil {
		fmt.Printf("Failed to generate token: %v\n", err)
		c.JSON(500, gin.H{"error": "Failed to generate token"})
		return
	}

	fmt.Printf("Login successful for user: %s (ID: %s)\n", user.Email, user.ID)

	c.JSON(200, gin.H{
		"token":   token,
		"user_id": user.ID,
		"email":   user.Email,
	})
}

// RegisterHandler handles registration requests.
// Validates the input, checks for existing users,
// hashes the password, creates a new user, and sends a verification email.
func RegisterHandler(c *gin.Context) {
	var registerRequest models.RegisterRequest
	if err := c.ShouldBindJSON(&registerRequest); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

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
		c.JSON(http.StatusConflict, gin.H{"error": "Email already registered"})
		return
	}

	// Hash the password before storing it in the database
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(registerRequest.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not hash password"})
		return
	}

	// Generate verification token
	token, expiry, err := auth.GenerateVerificationData()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not generate verification token"})
		return
	}

	// Create a new user in the database
	user := models.User{
		Email:              registerRequest.Email,
		Password:           string(hashedPassword),
		Verified:           false,
		VerificationToken:  token,
		VerificationExpiry: &expiry,
	}

	// Insert user into the DB
	userID, err := db.CreateUser(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not register user"})
		return
	}

	// Send verification email
	err = utils.SendVerificationEmail(user.Email, token, user.Email)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"message": "Registration successful, but could not send verification email",
			"user_id": userID,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Registration successful! Please check your email to verify your account.",
		"user_id": userID,
	})
}

// VerifyEmailHandler handles email verification requests.
// Verifies the user's email based on provide token
// and optionally returns a JWT token for immediate login.
func VerifyEmailHandler(c *gin.Context) {
	var verificationRequest models.EmailVerificationRequest
	if err := c.ShouldBindJSON(&verificationRequest); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid token"})
		return
	}

	fmt.Printf("Received verification token: %s\n", verificationRequest.Token)

	userID, err := db.VerifyUserEmail(verificationRequest.Token)
	if err != nil {
		fmt.Printf("Error verifying email: %s\n", err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	// Generate JWT for automatic login after verification
	token, err := auth.GenerateJWT(userID)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Email verification successful! Please log in.",
		})
		return
	}

	user, err := db.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Email verification successful! Please log in.",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Email verification successful!",
		"token":   token,
		"user_id": userID,
		"email":   user.Email,
	})
}

// ResendVerificationHandler handles requests to resend the verification email.
// Checks if user exists and is not already verified before sending new verification email.
func ResendVerificationHandler(c *gin.Context) {
	var resendRequest models.ResendVerificationRequest
	if err := c.ShouldBindJSON(&resendRequest); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// Check if user exists
	user, err := db.GetUserByEmail(resendRequest.Email)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Check if user is already verified
	if user.Verified {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email is already verified"})
		return
	}

	// Generate new verification token
	token, expiry, err := auth.GenerateVerificationData()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not generate verification token"})
		return
	}

	// Update token in database
	err = db.UpdateVerificationToken(user.Email, token, expiry)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not update verification token"})
		return
	}

	// Send verification email
	err = utils.SendVerificationEmail(user.Email, token, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not send verification email"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Verification email sent! Please check your inbox.",
	})
}

// Hnadles requests to delete a user's uploaded image.
// Requires a valid authenticated user.
func DeleteImageHandler(c *gin.Context) {
	// Get userID from the JWT token in the context
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get the image ID from the URL parameter
	imageID := c.Param("id")

	// Delete the image from the database
	err := db.DeleteImage(imageID, userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete image: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Image deleted successfully"})
}

// Helper function to validate email format.
// Uses a regular expression to check if the email is valid.
func isValidEmail(email string) bool {
	emailRegex := regexp.MustCompile(`^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,4}$`)
	return emailRegex.MatchString(email)
}

// Retrieves the authenticated user's profile information.
// Requires a valid JWT token to access the user's details.
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
		"id":       user.ID,
		"email":    user.Email,
		"verified": user.Verified,
	})
}

// Retrieves the authenticated user's profile information.
// Requires a valid JWT token to access the user's details.
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

// Retrieves the status of an image.
// Requires a valid JWT token to access the user's details.
func GetImageStatusHandler(c *gin.Context) {
	// Get userID from the JWT token in the context
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get the image ID from the URL parameter
	imageID := c.Param("id")
	if imageID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Image ID is required"})
		return
	}

	// First verify that the image belongs to the user
	belongs, err := db.VerifyImageOwnership(imageID, userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify image ownership"})
		return
	}

	if !belongs {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to access this image"})
		return
	}

	// Get the image status
	status, processedURL, err := db.GetImageStatus(context.Background(), imageID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get image status"})
		return
	}

	// Return the status and URL if available
	response := gin.H{
		"status": status,
	}

	if processedURL != "" {
		response["processed_url"] = processedURL
	}

	c.JSON(http.StatusOK, response)
}

// Handles requests to reset the password.
// Verifies the token and updates the password in the database.
func ForgotPasswordHandler(c *gin.Context) {
	var req models.ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// Check if user exists (but don't tell the user whether the account exists)
	user, err := db.GetUserByEmail(req.Email)
	if err != nil {
		// Even if user doesn't exist, return success to prevent email enumeration
		c.JSON(http.StatusOK, gin.H{"message": "If your email exists in our system, you will receive a password reset link"})
		return
	}

	// Generate reset token
	token, err := db.CreatePasswordResetToken(user.Email)
	if err != nil {
		fmt.Printf("Error creating reset token: %v\n", err)
		c.JSON(http.StatusOK, gin.H{"message": "If your email exists in our system, you will receive a password reset link"})
		return
	}

	// Send reset email
	err = utils.SendPasswordResetEmail(user.Email, token)
	if err != nil {
		fmt.Printf("Error sending reset email: %v\n", err)
		c.JSON(http.StatusOK, gin.H{"message": "If your email exists in our system, you will receive a password reset link"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password reset link sent to your email"})
}

// Verifies the password reset token.
// Checks if the token is valid and not expired.
func VerifyResetTokenHandler(c *gin.Context) {
	var req models.VerifyResetTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	email, err := db.VerifyResetToken(req.Token)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or expired reset token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Token verified successfully",
		"email":   email,
	})
}

// Resets the password for the user.
// Updates the password in the database if the token is valid.
func ResetPasswordHandler(c *gin.Context) {
	var req models.ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// Basic password validation
	if len(req.NewPassword) < 8 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password must be at least 8 characters"})
		return
	}

	// Verify the token is valid
	email, err := db.VerifyResetToken(req.Token)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or expired reset token"})
		return
	}

	// Update the password
	err = db.UpdatePassword(email, req.NewPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password has been reset successfully"})
}

// Retrieves the count of images uploaded by the user.
// Requires a valid JWT token to access the user's details.
func GetUserImageCountHandler(c *gin.Context) {
	// Get userID from the JWT token in the context
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get count of user images from database
	count, err := db.GetUserImageCount(userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve image count"})
		return
	}

	// Return count
	c.JSON(http.StatusOK, gin.H{
		"count": count,
	})
}
