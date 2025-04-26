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
	// First, identify the position of the JSON object by finding the first '{'
	jsonStartPos := strings.Index(task, "{")
	if jsonStartPos == -1 {
		log.Printf("Invalid task format (no JSON found): %s\n", task)
		return
	}

	// Find the position of the last '}'
	jsonEndPos := strings.LastIndex(task, "}")
	if jsonEndPos == -1 || jsonEndPos <= jsonStartPos {
		log.Printf("Invalid task format (unbalanced JSON): %s\n", task)
		return
	}

	// Extract the parts before the JSON
	prefix := task[:jsonStartPos]
	prefixParts := strings.Split(prefix, ":")
	if len(prefixParts) < 2 {
		log.Printf("Invalid task prefix: %s\n", prefix)
		return
	}

	// Extract the command and image key
	command := prefixParts[0]
	imageKey := prefixParts[1]

	// Extract the JSON options string
	jsonStr := task[jsonStartPos : jsonEndPos+1]

	// Extract userID (everything after the JSON)
	userID := ""
	if jsonEndPos+2 < len(task) {
		userIDPart := task[jsonEndPos+2:] // +2 to skip the '}' and ':'
		// Remove any leading colon that might be present
		userID = strings.TrimPrefix(userIDPart, ":")
	}

	// Parse the JSON options
	var options map[string]interface{}
	err := json.Unmarshal([]byte(jsonStr), &options)
	if err != nil {
		log.Printf("Error parsing options: %v\n", err)
		// Continue with default options
		options = map[string]interface{}{
			"resize": map[string]int{"width": 600},
		}
	}

	// Debug output
	log.Printf("Parsed task - Command: %s, ImageKey: %s, UserID: %s\n",
		command, imageKey, userID)

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
		x := getIntFromMap(cropInterface, "x")
		y := getIntFromMap(cropInterface, "y")
		width := getIntFromMap(cropInterface, "width")
		height := getIntFromMap(cropInterface, "height")

		if width > 0 && height > 0 {
			processedImg = processor.CropImage(processedImg, x, y, width, height)
			log.Printf("Applied cropping: x=%d, y=%d, width=%d, height=%d\n", x, y, width, height)
		}
	}

	// Apply resize if specified
	if resizeInterface, ok := options["resize"].(map[string]interface{}); ok {
		width := getIntFromMap(resizeInterface, "width")
		if width <= 0 {
			width = 600 // Default width
		}

		processedImg = processor.ResizeImage(processedImg, uint(width))
		log.Printf("Applied resizing: width=%d\n", width)
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

	var originalMeta db.ImageMeta

	// If we have the userID directly from the task, use it
	if userID != "" {
		originalMeta = db.ImageMeta{
			UserID: userID,
		}
	} else {
		// Fallback to database lookup if userID wasn't in the task
		originalMeta, err = db.GetImageMetaByFileName(context.Background(), conn, imageKey)
		if err != nil {
			log.Printf("Error retrieving original image metadata: %v\n", err)
			// Create an empty metadata object with a placeholder userID if lookup fails
			originalMeta = db.ImageMeta{
				UserID: "unknown",
			}
		}
	}

	// Update the image metadata in the database
	meta := db.ImageMeta{
		FileName:    processedKey,
		URL:         url,
		Size:        int64(len(processedImgBuf)),
		Uploaded:    time.Now(),
		ContentType: "image/jpeg",
		Width:       processedImg.Bounds().Dx(),
		Height:      processedImg.Bounds().Dy(),
		UserID:      originalMeta.UserID, // Use the UserID we determined
	}

	// Insert updated metadata into the database
	err = db.InsertImageMeta(context.Background(), conn, meta)
	if err != nil {
		log.Printf("Error inserting metadata into database: %v\n", err)
		return
	}

	log.Printf("Processed and uploaded image: %s\n", processedKey)
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
