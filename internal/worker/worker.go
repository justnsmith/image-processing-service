package worker

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"image-processing-service/internal/db"
	"image-processing-service/internal/processor"
	"image-processing-service/internal/queue"
	"image-processing-service/internal/storage"
	"log/slog"
	"strings"
	"time"
)

// Initializes the worker to process tasks from the queue
func StartWorker(ctx context.Context) {
	loggedEmptyQueue := false
	for {
		select {
		case <-ctx.Done():
			slog.Info("worker stopping")
			return
		default:
			// Dequeue task
			task, err := queue.DequeueTask(ctx)
			if err != nil {
				// Handle the case where the queue is empty or other errors occur
				if err.Error() == "redis: nil" {
					// Only log once if queue is empty
					if !loggedEmptyQueue {
						slog.Info("queue is empty, waiting for tasks")
						loggedEmptyQueue = true
					}
					// Sleep and check again
					time.Sleep(2 * time.Second)
					continue
				}
				// If some other error occurs, log it and continue
				slog.Error("error dequeuing task", "error", err)
				time.Sleep(5 * time.Second)
				continue
			}
			// Task found, process it
			loggedEmptyQueue = false
			slog.Info("processing task", "task", task)
			processImageTask(ctx, task)
		}
	}
}

// Processes the image task from the queue
func processImageTask(ctx context.Context, task string) {
	parts := strings.SplitN(task, ":", 4)
	if len(parts) < 4 {
		slog.Error("invalid task format", "task", task)
		return
	}

	command := parts[0]
	imageKey := parts[1]
	encodedOptions := parts[2]
	userID := parts[3]

	// Only process "process" commands
	if command != "process" {
		slog.Error("unknown command", "command", command)
		return
	}

	// Decode the Base64 JSON options
	jsonBytes, err := base64.StdEncoding.DecodeString(encodedOptions)
	if err != nil {
		slog.Error("error decoding task options", "error", err)
		return
	}

	// Parse the JSON options
	var options map[string]interface{}
	if err = json.Unmarshal(jsonBytes, &options); err != nil {
		slog.Error("error parsing task options", "error", err)
		return
	}

	// Get the image ID from options
	imageID, ok := options["imageID"].(string)
	if !ok {
		slog.Error("missing imageID in task options")
		return
	}

	// Update status to "processing"
	if err = db.UpdateImageStatus(ctx, imageID, "processing", ""); err != nil {
		slog.Error("error updating image status", "image_id", imageID, "error", err)
		return
	}

	// Download the original image from S3
	imgBuf, err := storage.DownloadFromS3(ctx, imageKey)
	if err != nil {
		slog.Error("error downloading image", "image_id", imageID, "key", imageKey, "error", err)
		db.UpdateImageStatus(ctx, imageID, "failed", "")
		return
	}

	// Decode the image
	img, _, err := processor.DecodeImage(imgBuf)
	if err != nil {
		slog.Error("error decoding image", "image_id", imageID, "error", err)
		db.UpdateImageStatus(ctx, imageID, "failed", "")
		return
	}

	// Process the image according to the options
	processedImg := img

	// Apply resize if specified
	if resizeInterface, ok := options["resize"].(map[string]interface{}); ok {
		width := getIntFromMap(resizeInterface, "width")
		if width <= 0 {
			width = 600
		}
		processedImg = processor.ResizeImage(processedImg, uint(width))
		slog.Info("applied resize", "image_id", imageID, "width", width)
	}

	// Apply crop if specified
	if cropInterface, ok := options["crop"].(map[string]interface{}); ok {
		x := getIntFromMap(cropInterface, "x")
		y := getIntFromMap(cropInterface, "y")
		width := getIntFromMap(cropInterface, "width")
		height := getIntFromMap(cropInterface, "height")

		if width > 0 && height > 0 {
			processedImg = processor.CropImage(processedImg, x, y, width, height)
			slog.Info("applied crop", "image_id", imageID, "x", x, "y", y, "width", width, "height", height)
		}
	}

	// Apply tint if specified
	if tintHex, ok := options["tint"].(string); ok {
		tintColor, err := processor.ParseHexColor(tintHex)
		if err == nil {
			processedImg = processor.AddTint(processedImg, tintColor)
			slog.Info("applied tint", "image_id", imageID, "color", tintHex)
		} else {
			slog.Warn("invalid tint color", "image_id", imageID, "color", tintHex)
		}
	}

	// Compress the processed image
	processedImgBuf, err := processor.CompressJPEG(processedImg, 85)
	if err != nil {
		slog.Error("error compressing image", "image_id", imageID, "error", err)
		db.UpdateImageStatus(ctx, imageID, "failed", "")
		return
	}

	// Upload the processed image to S3
	processedKey := fmt.Sprintf("processed/%s_%d.jpg", strings.TrimPrefix(imageKey, "originals/"), time.Now().Unix())
	processedURL, err := storage.UploadToS3(ctx, processedKey, processedImgBuf)
	if err != nil {
		slog.Error("error uploading processed image", "image_id", imageID, "error", err)
		db.UpdateImageStatus(ctx, imageID, "failed", "")
		return
	}

	// Update the image status to completed with the processed URL
	if err = db.UpdateImageStatus(ctx, imageID, "completed", processedURL); err != nil {
		slog.Error("error updating image status to completed", "image_id", imageID, "error", err)
		return
	}

	slog.Info("image processed successfully", "image_id", imageID, "user_id", userID)
}

// Helper function to extract integers from map with different possible types
func getIntFromMap(m map[string]interface{}, key string) int {
	if val, ok := m[key].(float64); ok {
		return int(val)
	} else if val, ok := m[key].(int); ok {
		return val
	}
	return 0
}
