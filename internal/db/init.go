package db

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
)

// InitDB initializes the database tables by executing a schema SQL file.
// THis function will read the SQL scheme from a file and apply it to connected database
// to set up the required tables and structures.
//
// The process goes through the following steps:
//	 1. Retrieves a database connection pool by calling GetDBPool().
//   2. Determines the curr working directory to locate schema file.
//   3. Reads contents of schema.sql file
//   4. Executes SQl schema using database connection pool
//   5. Logs message indicating successful initialization.
func InitDB() error {
    pool, err := GetDBPool()
    if err != nil {
        return err
    }

    // Get the current directory
    dir, err := os.Getwd()
    if err != nil {
        return fmt.Errorf("failed to get current directory: %w", err)
    }

    // Read the schema file
    schemaPath := filepath.Join(dir, "schema.sql")
    schemaSQL, err := os.ReadFile(schemaPath)
    if err != nil {
        return fmt.Errorf("failed to read schema file: %w", err)
    }

    // Execute the SQL schema
    _, err = pool.Exec(context.Background(), string(schemaSQL))
    if err != nil {
        return fmt.Errorf("failed to execute schema: %w", err)
    }

    log.Println("Database initialized successfully")
    return nil
}
