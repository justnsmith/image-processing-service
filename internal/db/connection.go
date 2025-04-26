package db

import (
	"context"
	"fmt"
	"os"
	"sync"

	"github.com/jackc/pgx/v4/pgxpool"
)

var (
	dbPool     *pgxpool.Pool
	poolOnce   sync.Once
	poolError  error
)

// GetDBPool returns a singleton database connection pool
func GetDBPool() (*pgxpool.Pool, error) {
	poolOnce.Do(func() {
		user := os.Getenv("POSTGRES_USER")
		password := os.Getenv("POSTGRES_PASSWORD")
		dbname := os.Getenv("POSTGRES_DB")
		host := os.Getenv("POSTGRES_HOST")
		port := os.Getenv("POSTGRES_PORT")
		sslmode := os.Getenv("POSTGRES_SSLMODE")

		dsn := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s",
			user, password, host, port, dbname, sslmode,
		)

		// Create a connection pool instead of a single connection
		dbPool, poolError = pgxpool.Connect(context.Background(), dsn)
	})

	return dbPool, poolError
}

// CloseDBPool closes the database connection pool
func CloseDBPool() {
	if dbPool != nil {
		dbPool.Close()
	}
}
