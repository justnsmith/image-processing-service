package handler

import (
	"fmt"
	"net/http"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
)

func UploadHandler(c *gin.Context) {
	// Get the uploaded file
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file is received"})
		return
	}

	ext := filepath.Ext(file.Filename)
	newName := fmt.Sprintf("img_%d%s", time.Now().Unix(), ext)

	c.JSON(http.StatusOK, gin.H{
		"message":     "Received file",
		"original":    file.Filename,
		"stored_name": newName,
	})
}
