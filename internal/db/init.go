package db

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
)

// InitDB initializes the database tables
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
