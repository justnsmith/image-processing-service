package handler

import (
	"bytes"
	"context"
	"fmt"
	"image-processing-service/internal/db"
	"image-processing-service/internal/storage"
	"image-processing-service/internal/processor"
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

	// Decode the image
	img, err := processor.DecodeImage(buf.Bytes())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode image"})
		return
	}

	// Resize the image to a new width
	resizedImg := processor.ResizeImage(img, 800)

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
	width := resizedImg.Bounds().Dx()
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
	}

	// Insert resized image metadata into the database
	err = db.InsertImageMeta(context.Background(), conn, meta)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DB insert failed"})
		return
	}

	// Return success response with the S3 URL and metadata
	c.JSON(http.StatusOK, gin.H{
		"message":    "Uploaded resized image to S3 and saved metadata",
		"s3_url":     url,
		"stored_key": key,
	})
}
