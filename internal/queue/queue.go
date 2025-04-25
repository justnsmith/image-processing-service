// internal/queue/queue.go
package queue

import (
	"context"

	"github.com/redis/go-redis/v9"
)

var Rdb = redis.NewClient(&redis.Options{
	Addr: "localhost:6379",
})

// EnqueueTask adds a task to the Redis queue
func EnqueueTask(ctx context.Context, task string) error {
	// "image_tasks" is the name of the Redis list queue
	return Rdb.LPush(ctx, "image_tasks", task).Err()
}

// DequeueTask fetches a task from the Redis queue
func DequeueTask(ctx context.Context) (string, error) {
	return Rdb.RPop(ctx, "image_tasks").Result()
}
