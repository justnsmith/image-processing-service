package handler

import (
	"context"
	"image-processing-service/internal/db"
	"image-processing-service/internal/queue"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// HealthHandler checks the health of the service and its dependencies.
// Returns 200 if all dependencies are reachable, 503 otherwise.
func HealthHandler(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Second)
	defer cancel()

	status := gin.H{
		"status": "ok",
		"checks": gin.H{
			"postgres": checkPostgres(ctx),
			"redis":    checkRedis(ctx),
		},
	}

	// Degrade to 503 if any dependency is unhealthy
	checks := status["checks"].(gin.H)
	for _, v := range checks {
		if v != "ok" {
			status["status"] = "degraded"
			c.JSON(http.StatusServiceUnavailable, status)
			return
		}
	}

	c.JSON(http.StatusOK, status)
}

func checkPostgres(ctx context.Context) string {
	pool, err := db.GetDBPool()
	if err != nil {
		return "unavailable"
	}
	if err := pool.Ping(ctx); err != nil {
		return "unavailable"
	}
	return "ok"
}

func checkRedis(ctx context.Context) string {
	if err := queue.Rdb.Ping(ctx).Err(); err != nil {
		return "unavailable"
	}
	return "ok"
}
