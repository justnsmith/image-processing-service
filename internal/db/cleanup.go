package db

import (
	"context"
	"log"
	"time"
)

// CleanupUnverifiedAccounts removes unverified accounts older than the specified duration.
// This function connects to database and deletes user records where:
//   - The acount is unverified (verified = false)
//   - The account's creation date is older than the maxAge.
// The function then returns the number of accounts that were deleted and any errors encountered.
func CleanupUnverifiedAccounts(ctx context.Context, maxAge time.Duration) (int64, error) {
	pool, err := GetDBPool()
	if err != nil {
		return 0, err
	}

	cutoffTime := time.Now().Add(-maxAge)

	// Delete query to remove unverified accounts older than cutoff time
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
