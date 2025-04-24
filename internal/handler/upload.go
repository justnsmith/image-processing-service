package handler

import (
	"bytes"
	"context"
	"fmt"
	"image"
	"image-processing-service/internal/db"
	"image-processing-service/internal/storage"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"net/http"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v4"
)

func UploadImageHandler(c *gin.Context, conn *pgx.Conn) {
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

	// Get content type
	contentType := http.DetectContentType(buf.Bytes())

	// Get image dimensions (width and height)
	var width, height int
	img, _, err := image.Decode(bytes.NewReader(buf.Bytes()))
	if err == nil {
		width = img.Bounds().Dx()
		height = img.Bounds().Dy()
	}

	// Create metadata object
	meta := db.ImageMeta{
		FileName:    fileHeader.Filename,
		URL:         url,
		Size:        fileHeader.Size,
		Uploaded:    time.Now(),
		ContentType: contentType,
		Width:       width,
		Height:      height,
	}

	// Insert into database
	err = db.InsertImageMeta(context.Background(), conn, meta)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DB insert failed"})
		return
	}

	// Return success
	c.JSON(http.StatusOK, gin.H{
		"message":    "Uploaded to S3 and saved metadata",
		"s3_url":     url,
		"stored_key": key,
	})
}
