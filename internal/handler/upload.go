package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"encoding/base64"
	"fmt"
	"image-processing-service/internal/db"
	"image-processing-service/internal/models"
	"image-processing-service/internal/processor"
	"image-processing-service/internal/queue"
	"image-processing-service/internal/storage"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"net/http"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// UploadImageHandler handles image uploads, stores original image, and queues processing tasks
func UploadImageHandler(c *gin.Context, userID string) {
	// Get the uploaded file from the request
	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}

	// Open the uploaded file
	file, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open file"})
		return
	}
	defer file.Close()

	// Read file into buffer
	var buf bytes.Buffer
	_, err = buf.ReadFrom(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read file"})
		return
	}

	// Unique S3 object name for the original image
	originalKey := fmt.Sprintf("originals/img_%d%s", time.Now().Unix(), filepath.Ext(fileHeader.Filename))

	// Upload original image to S3
	originalURL, err := storage.UploadToS3(context.Background(), originalKey, buf.Bytes())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "S3 upload failed"})
		return
	}

	// Decode the image to get dimensions
	originalImg, _, err := processor.DecodeImage(buf.Bytes())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode image"})
		return
	}

	// Get content type for original image
	contentType := http.DetectContentType(buf.Bytes())

	// Create metadata object for original image with "pending" status
	meta := models.ImageMeta{
		FileName:    fileHeader.Filename,
		URL:         originalURL,
		S3Key:       originalKey,
		Size:        int64(len(buf.Bytes())),
		Uploaded:    time.Now(),
		ContentType: contentType,
		Width:       originalImg.Bounds().Dx(),
		Height:      originalImg.Bounds().Dy(),
		UserID:      userID,
		Status:      "pending", // Mark as pending processing
	}

	// Insert original image metadata into the database
	imageID, err := db.InsertImageMeta(context.Background(), meta)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DB insert failed"})
		return
	}

	// Get image processing parameters from form
	width := 800 // DEFAULT
	if widthStr := c.PostForm("width"); widthStr != "" {
		if w, err := strconv.Atoi(widthStr); err == nil && w > 0 {
			width = w
		}
	}

	// Get crop parameters
	cropX, _ := strconv.Atoi(c.PostForm("cropX"))
	cropY, _ := strconv.Atoi(c.PostForm("cropY"))
	cropWidth, _ := strconv.Atoi(c.PostForm("cropWidth"))
	cropHeight, _ := strconv.Atoi(c.PostForm("cropHeight"))

	// Get tint color
	tintColor := c.PostForm("tintColor")

	// Create processing options JSON
	processingOptions := map[string]interface{}{
		"imageID": imageID,
		"resize": map[string]int{
			"width": width,
		},
	}

	// Add crop if specified
	if cropWidth > 0 && cropHeight > 0 {
		processingOptions["crop"] = map[string]int{
			"x":      cropX,
			"y":      cropY,
			"width":  cropWidth,
			"height": cropHeight,
		}
	}

	// Add tint if specified
	if tintColor != "" {
		processingOptions["tint"] = tintColor
	}

	// Convert options to JSON
	optionsJSON, err := json.Marshal(processingOptions)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to encode processing options"})
		return
	}

	// Create task for the queue - Base64 encode the JSON to avoid delimiter issues
	encodedOptions := base64.StdEncoding.EncodeToString(optionsJSON)
	task := fmt.Sprintf("process:%s:%s:%s", originalKey, encodedOptions, userID)

	// Queue the processing task
	err = queue.EnqueueTask(context.Background(), task)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to queue processing task"})
		return
	}

	// Return success response with the original S3 URL and metadata
	c.JSON(http.StatusOK, gin.H{
		"message":      "Image uploaded and queued for processing",
		"id":           imageID,
		"original_url": originalURL,
		"stored_key":   originalKey,
		"width":        originalImg.Bounds().Dx(),
		"height":       originalImg.Bounds().Dy(),
		"status":       "pending",
	})
}
