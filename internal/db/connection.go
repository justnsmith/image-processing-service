package db

import (
	"context"
	"fmt"
	"os"
	"sync"

	"github.com/jackc/pgx/v4/pgxpool"
)

var (
	dbPool    *pgxpool.Pool // Database connection pool
	poolOnce  sync.Once     // Makes sure database pool is only created once
	poolError error         // Stores any error that occurs during pool creation
)

// GetDBPool returns a singleton database connection pool.
// This function ensures that the database connection pool is created only once
// and will return the same pool for subsequent calls.
// It constructs a connection string from env variables and creates a connection pool
// using the pgxpool.Connect method. If connection pool creation failes, an error is returned.
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

// CloseDBPool closes the database connection pool, releasing all connections.
// This function should be called when the application is shutting down
// to cleanly release the resources assocaited with the database connection pool.
func CloseDBPool() {
	if dbPool != nil {
		dbPool.Close()
	}
}
