package worker

import (
	"context"
	"encoding/json"
	"fmt"
	"image-processing-service/internal/db"
	"image-processing-service/internal/processor"
	"image-processing-service/internal/queue"
	"image-processing-service/internal/storage"
	"log"
	"strings"
	"time"
)

func StartWorker(ctx context.Context) {
	loggedEmptyQueue := false
	for {
		select {
		case <-ctx.Done():
			log.Println("Worker stopping due to context cancellation")
			return
		default:
			// Dequeue task
			task, err := queue.DequeueTask(ctx)
			if err != nil {
				// Handle the case where the queue is empty or other errors occur
				if err.Error() == "redis: nil" {
					// Only log once if queue is empty
					if !loggedEmptyQueue {
						log.Println("Queue is empty. Waiting for tasks...")
						loggedEmptyQueue = true
					}
					// Sleep and check again
					time.Sleep(2 * time.Second)
					continue
				}
				// If some other error occurs, log it and continue
				log.Printf("Error dequeuing task: %v\n", err)
				time.Sleep(5 * time.Second)
				continue
			}
			// Task found, process it
			loggedEmptyQueue = false
			log.Printf("Processing task: %s\n", task)
			processImageTask(ctx, task)
		}
	}
}

func processImageTask(ctx context.Context, task string) {
	// Parse task parts: command:imageKey:JSON:userID
	parts := strings.SplitN(task, ":", 4)
	if len(parts) < 4 {
		log.Printf("Invalid task format: %s\n", task)
		return
	}

	command := parts[0]
	imageKey := parts[1]
	jsonOptions := parts[2]
	userID := parts[3]

	// Only process "process" commands
	if command != "process" {
		log.Printf("Unknown command: %s\n", task)
		return
	}

	// Parse the JSON options
	var options map[string]interface{}
	err := json.Unmarshal([]byte(jsonOptions), &options)
	if err != nil {
		log.Printf("Error parsing options: %v\n", err)
		return
	}

	// Get the image ID from options
	imageID, ok := options["imageID"].(string)
	if !ok {
		log.Printf("Missing imageID in options\n")
		return
	}

	// Update status to "processing"
	err = db.UpdateImageStatus(ctx, imageID, "processing", "")
	if err != nil {
		log.Printf("Error updating image status: %v\n", err)
		return
	}

	// Download the original image from S3
	imgBuf, err := storage.DownloadFromS3(ctx, imageKey)
	if err != nil {
		log.Printf("Error downloading image: %v\n", err)
		db.UpdateImageStatus(ctx, imageID, "failed", "")
		return
	}

	// Decode the image
	img, _, err := processor.DecodeImage(imgBuf)
	if err != nil {
		log.Printf("Error decoding image: %v\n", err)
		db.UpdateImageStatus(ctx, imageID, "failed", "")
		return
	}

	// Process the image according to the options
	processedImg := img

	// Apply resize if specified
	if resizeInterface, ok := options["resize"].(map[string]interface{}); ok {
		width := getIntFromMap(resizeInterface, "width")
		if width <= 0 {
			width = 600 // Default width
		}

		processedImg = processor.ResizeImage(processedImg, uint(width))
		log.Printf("Applied resizing: width=%d\n", width)
	}

	// Apply crop if specified
	if cropInterface, ok := options["crop"].(map[string]interface{}); ok {
		x := getIntFromMap(cropInterface, "x")
		y := getIntFromMap(cropInterface, "y")
		width := getIntFromMap(cropInterface, "width")
		height := getIntFromMap(cropInterface, "height")

		if width > 0 && height > 0 {
			processedImg = processor.CropImage(processedImg, x, y, width, height)
			log.Printf("Applied cropping: x=%d, y=%d, width=%d, height=%d\n", x, y, width, height)
		}
	}

	// Apply tint if specified
	if tintHex, ok := options["tint"].(string); ok {
		tintColor, err := processor.ParseHexColor(tintHex)
		if err == nil {
			processedImg = processor.AddTint(processedImg, tintColor)
			log.Printf("Applied tint: %s\n", tintHex)
		} else {
			log.Printf("Invalid tint color: %s\n", tintHex)
		}
	}

	// Compress the processed image
	processedImgBuf, err := processor.CompressJPEG(processedImg, 85)
	if err != nil {
		log.Printf("Error compressing image: %v\n", err)
		db.UpdateImageStatus(ctx, imageID, "failed", "")
		return
	}

	// Upload the processed image to S3
	processedKey := fmt.Sprintf("processed/%s_%d.jpg", strings.TrimPrefix(imageKey, "originals/"), time.Now().Unix())
	processedURL, err := storage.UploadToS3(ctx, processedKey, processedImgBuf)
	if err != nil {
		log.Printf("Error uploading processed image: %v\n", err)
		db.UpdateImageStatus(ctx, imageID, "failed", "")
		return
	}

	// Update the image status to completed with the processed URL
	err = db.UpdateImageStatus(ctx, imageID, "completed", processedURL)
	if err != nil {
		log.Printf("Error updating image status: %v\n", err)
		return
	}

	log.Printf("Successfully processed image %s for user %s\n", imageID, userID)
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
