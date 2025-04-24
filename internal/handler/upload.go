package handler

import (
	"bytes"
	"context"
	"fmt"
	"image-processing-service/internal/storage"

	"net/http"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
)

func UploadImageHandler(c *gin.Context) {
	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}

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

	// Unique S3 object name
	key := fmt.Sprintf("images/img_%d%s", time.Now().Unix(), filepath.Ext(fileHeader.Filename))

	// Upload to S3
	url, err := storage.UploadToS3(context.Background(), key, buf.Bytes())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "S3 upload failed"})
		return
	}

	// Return public URL
	c.JSON(http.StatusOK, gin.H{
		"message":    "Uploaded to S3",
		"s3_url":     url,
		"stored_key": key,
	})
}
