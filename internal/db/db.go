package db

import (
	"context"
	"fmt"
	"image-processing-service/internal/models"
	"github.com/jackc/pgx/v4"
	"os"
)

// GetUserByEmail retrieves a user by their email from the database
func GetUserByEmail(email string) (models.User, error) {
	var user models.User

	conn, err := connectToDB()
	if err != nil {
		return user, err
	}
	defer conn.Close(context.Background())

	query := "SELECT id, email, password FROM users WHERE email = $1"
	err = conn.QueryRow(context.Background(), query, email).Scan(&user.ID, &user.Email, &user.Password)
	if err != nil {
		return user, err
	}

	return user, nil
}

// CreateUser inserts a new user into the database
func CreateUser(user models.User) error {
	conn, err := connectToDB()
	if err != nil {
		return err
	}
	defer conn.Close(context.Background())

	query := "INSERT INTO users (email, password) VALUES ($1, $2)"
	_, err = conn.Exec(context.Background(), query, user.Email, user.Password)
	if err != nil {
		return err
	}

	return nil
}

// Connect to the PostgreSQL database
func connectToDB() (*pgx.Conn, error) {
	user := os.Getenv("POSTGRES_USER")
	password := os.Getenv("POSTGRES_PASSWORD")
	dbname := os.Getenv("POSTGRES_DB")
	host := os.Getenv("POSTGRES_HOST")
	port := os.Getenv("POSTGRES_PORT")
	sslmode := os.Getenv("POSTGRES_SSLMODE")
	dsn := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s",
		user, password, host, port, dbname, sslmode,
	)
	conn, err := pgx.Connect(context.Background(), dsn)
	if err != nil {
		return nil, err
	}
	return conn, nil
}
