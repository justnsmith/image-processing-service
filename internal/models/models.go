package models

// LoginRequest represents the structure of data expected for the login API
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// RegisterRequest represents the structure of data expected for the registration API
type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// User represents a user entity, which will be stored in the database
type User struct {
	ID       string `json:"id"`
	Email    string `json:"email"`
	Password string `json:"password"`
}
