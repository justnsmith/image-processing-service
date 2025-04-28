package db

import (
	"context"
	"log"
	"time"
)

// CleanupUnverifiedAccounts removes unverified accounts older than the specified duration
func CleanupUnverifiedAccounts(ctx context.Context, maxAge time.Duration) (int64, error) {
	pool, err := GetDBPool()
	if err != nil {
		return 0, err
	}

	cutoffTime := time.Now().Add(-maxAge)

	result, err := pool.Exec(ctx,
		`DELETE FROM users
		 WHERE verified = false
		 AND created_at < $1`,
		cutoffTime)

	if err != nil {
		return 0, err
	}

	count := result.RowsAffected()
	log.Printf("Cleaned up %d unverified accounts older than %v", count, maxAge)
	return count, nil
}
