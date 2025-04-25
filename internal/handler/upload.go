package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"image-processing-service/internal/db"
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
	"github.com/jackc/pgx/v4"
)

// UploadImageHandler handles image uploads, processing, and task queuing.
func UploadImageHandler(c *gin.Context, conn *pgx.Conn, userID string) {
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

	// Decode the image
	img, _, err := processor.DecodeImage(buf.Bytes())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode image"})
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

	// Create a processing options object for the background task
	procOptions := map[string]interface{}{
		"resize": map[string]int{"width": 600},
	}

	// Add crop parameters if provided
	if cropWidth > 0 && cropHeight > 0 {
		procOptions["crop"] = map[string]int{
			"x":      cropX,
			"y":      cropY,
			"width":  cropWidth,
			"height": cropHeight,
		}
	}

	// Add tint if provided
	if tintColor != "" {
		procOptions["tint"] = tintColor
	}

	// Resize the image for immediate preview using user-specified width
	resizedImg := processor.ResizeImage(img, uint(width))

	// Compress resized image
	resizedImgBuf, err := processor.CompressJPEG(resizedImg, 85)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to compress image"})
		return
	}

	// Unique S3 object name for the resized image
	key := fmt.Sprintf("images/img_%d_resized%s", time.Now().Unix(), filepath.Ext(fileHeader.Filename))

	// Upload resized image to S3
	url, err := storage.UploadToS3(context.Background(), key, resizedImgBuf)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "S3 upload failed"})
		return
	}

	// Get content type for resized image
	contentType := http.DetectContentType(resizedImgBuf)

	// Get new dimensions of the resized image
	width = resizedImg.Bounds().Dx()
	height := resizedImg.Bounds().Dy()

	// Create metadata object for resized image
	meta := db.ImageMeta{
		FileName:    fileHeader.Filename,
		URL:         url,
		Size:        fileHeader.Size,
		Uploaded:    time.Now(),
		ContentType: contentType,
		Width:       width,
		Height:      height,
		UserID:      userID,
	}

	// Insert resized image metadata into the database
	err = db.InsertImageMeta(context.Background(), conn, meta)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DB insert failed"})
		return
	}

	// Convert processing options to JSON
	optionsJSON, err := json.Marshal(procOptions)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to encode processing options"})
		return
	}

	// Enqueue the image processing task for the worker with options
	task := fmt.Sprintf("process_image:%s:%s", key, string(optionsJSON))
	err = queue.EnqueueTask(context.Background(), task)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to enqueue task"})
		return
	}

	// Return success response with the S3 URL and metadata
	c.JSON(http.StatusOK, gin.H{
		"message":    "Uploaded resized image to S3, saved metadata, and task enqueued for processing",
		"s3_url":     url,
		"stored_key": key,
		"width":      width,
		"height":     height,
	})
}
