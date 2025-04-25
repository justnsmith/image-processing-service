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

	"github.com/jackc/pgx/v4"
)

func StartWorker(ctx context.Context, conn *pgx.Conn) {
	loggedEmptyQueue := false
	for {
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
			// If some other error occurs, log it and stop the worker
			log.Printf("Error dequeuing task: %v\n", err)
			break
		}
		// Task found, process it
		loggedEmptyQueue = false
		log.Printf("Processing task: %s\n", task)
		processTask(task, conn)
	}
}

func processTask(task string, conn *pgx.Conn) {
	// Extract task data (split by colon)
	parts := strings.SplitN(task, ":", 3)
	if len(parts) < 2 {
		log.Printf("Invalid task format: %s\n", task)
		return
	}

	imageKey := parts[1]
	var options map[string]interface{}

	// Parse options if provided
	if len(parts) > 2 {
		err := json.Unmarshal([]byte(parts[2]), &options)
		if err != nil {
			log.Printf("Error parsing options: %v\n", err)
			// Continue with default options
			options = map[string]interface{}{
				"resize": map[string]int{"width": 600},
			}
		}
	} else {
		// Set default options if none provided
		options = map[string]interface{}{
			"resize": map[string]int{"width": 600},
		}
	}

	// Download the image from S3
	imgBuf, err := storage.DownloadFromS3(context.Background(), imageKey)
	if err != nil {
		log.Printf("Error downloading image: %v\n", err)
		return
	}

	// Decode the image
	img, _, err := processor.DecodeImage(imgBuf)
	if err != nil {
		log.Printf("Error decoding image: %v\n", err)
		return
	}

	// Process the image according to the options
	processedImg := img

	// Apply crop if specified
	if cropInterface, ok := options["crop"].(map[string]interface{}); ok {
		// Extract crop parameters, handling potential type conversions
		var x, y, width, height int

		if val, ok := cropInterface["x"].(float64); ok {
			x = int(val)
		} else if val, ok := cropInterface["x"].(int); ok {
			x = val
		}

		if val, ok := cropInterface["y"].(float64); ok {
			y = int(val)
		} else if val, ok := cropInterface["y"].(int); ok {
			y = val
		}

		if val, ok := cropInterface["width"].(float64); ok {
			width = int(val)
		} else if val, ok := cropInterface["width"].(int); ok {
			width = val
		}

		if val, ok := cropInterface["height"].(float64); ok {
			height = int(val)
		} else if val, ok := cropInterface["height"].(int); ok {
			height = val
		}

		if width > 0 && height > 0 {
			processedImg = processor.CropImage(processedImg, x, y, width, height)
			log.Printf("Applied cropping: x=%d, y=%d, width=%d, height=%d\n", x, y, width, height)
		}
	}

	// Apply resize if specified
	if resizeInterface, ok := options["resize"].(map[string]interface{}); ok {
		var width int = 600 // Default width

		if val, ok := resizeInterface["width"].(float64); ok {
			width = int(val)
		} else if val, ok := resizeInterface["width"].(int); ok {
			width = val
		}

		if width > 0 {
			processedImg = processor.ResizeImage(processedImg, uint(width))
			log.Printf("Applied resizing: width=%d\n", width)
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
		return
	}

	// Upload the processed image to S3
	processedKey := fmt.Sprintf("processed/%s", imageKey)
	url, err := storage.UploadToS3(context.Background(), processedKey, processedImgBuf)
	if err != nil {
		log.Printf("Error uploading processed image: %v\n", err)
		return
	}

	// Update the image metadata in the database
	meta := db.ImageMeta{
		FileName:    imageKey,
		URL:         url,
		Size:        int64(len(processedImgBuf)),
		Uploaded:    time.Now(),
		ContentType: "image/jpeg",
		Width:       processedImg.Bounds().Dx(),
		Height:      processedImg.Bounds().Dy(),
	}

	// Insert updated metadata into the database
	err = db.InsertImageMeta(context.Background(), conn, meta)
	if err != nil {
		log.Printf("Error inserting metadata into database: %v\n", err)
		return
	}

	log.Printf("Processed and uploaded image: %s\n", imageKey)
}
