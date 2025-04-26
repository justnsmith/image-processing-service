package handler

import (
	"bytes"
	"context"
	"fmt"
	"image-processing-service/internal/db"
	"image-processing-service/internal/processor"
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

	// Check if we have any modifications
	hasModifications := width != img.Bounds().Dx() ||
		(cropWidth > 0 && cropHeight > 0) ||
		tintColor != ""

	// If no modifications, don't process further
	if !hasModifications {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No image modifications specified"})
		return
	}

	// Process the image with the requested modifications
	processedImg := processor.ResizeImage(img, uint(width))

	// Apply crop if specified
	if cropWidth > 0 && cropHeight > 0 {
		processedImg = processor.CropImage(processedImg, cropX, cropY, cropWidth, cropHeight)
	}

	// Apply tint if specified
	if tintColor != "" {
		tintColor, err := processor.ParseHexColor(tintColor)
		if err == nil {
			processedImg = processor.AddTint(processedImg, tintColor)
		}
	}

	// Compress processed image
	processedImgBuf, err := processor.CompressJPEG(processedImg, 85)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to compress image"})
		return
	}

	// Unique S3 object name for the processed image
	key := fmt.Sprintf("images/img_%d_processed%s", time.Now().Unix(), filepath.Ext(fileHeader.Filename))

	// Upload processed image to S3
	url, err := storage.UploadToS3(context.Background(), key, processedImgBuf)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "S3 upload failed"})
		return
	}

	// Get content type for processed image
	contentType := http.DetectContentType(processedImgBuf)

	// Get dimensions of the processed image
	width = processedImg.Bounds().Dx()
	height := processedImg.Bounds().Dy()

	// Create metadata object for processed image
	meta := db.ImageMeta{
		FileName:    fileHeader.Filename,
		URL:         url,
		Size:        int64(len(processedImgBuf)),
		Uploaded:    time.Now(),
		ContentType: contentType,
		Width:       width,
		Height:      height,
		UserID:      userID,
	}

	// Insert processed image metadata into the database
	err = db.InsertImageMeta(context.Background(), conn, meta)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DB insert failed"})
		return
	}

	// Return success response with the S3 URL and metadata
	c.JSON(http.StatusOK, gin.H{
		"message":    "Uploaded processed image to S3 and saved metadata",
		"s3_url":     url,
		"stored_key": key,
		"width":      width,
		"height":     height,
	})
}
