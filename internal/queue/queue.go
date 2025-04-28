// internal/queue/queue.go
package queue

import (
	"context"
	"os"
	"github.com/redis/go-redis/v9"
)

var Rdb *redis.Client

// Initialize Redis client
func init() {
	// Get Redis URL from environment variable or use default
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		// Default fallback if environment variable is not set
		Rdb = redis.NewClient(&redis.Options{
			Addr: "localhost:6379",
		})
	} else {
		// Parse the Redis URL from environment variable
		opt, err := redis.ParseURL(redisURL)
		if err != nil {
			panic(err)
		}
		Rdb = redis.NewClient(opt)
	}
}

// Adds a task to the Redis queue
func EnqueueTask(ctx context.Context, task string) error {
	// "image_tasks" is the name of the Redis list queue
	return Rdb.LPush(ctx, "image_tasks", task).Err()
}

// Fetches a task from the Redis queue
func DequeueTask(ctx context.Context) (string, error) {
	return Rdb.RPop(ctx, "image_tasks").Result()
}
