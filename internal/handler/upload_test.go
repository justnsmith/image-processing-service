package handler

import (
	"bytes"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

// newUploadRouter wires UploadImageHandler with a fixed userID, mirroring main.go.
func newUploadRouter() *gin.Engine {
	r := gin.New()
	r.MaxMultipartMemory = MaxFileSize
	r.POST("/upload", func(c *gin.Context) {
		UploadImageHandler(c, "test-user-id")
	})
	return r
}

// multipartRequest builds a multipart/form-data POST request with a single file field.
func multipartRequest(t *testing.T, fieldName, fileName string, content []byte) *http.Request {
	t.Helper()
	var buf bytes.Buffer
	w := multipart.NewWriter(&buf)
	fw, err := w.CreateFormFile(fieldName, fileName)
	if err != nil {
		t.Fatalf("create form file: %v", err)
	}
	if _, err = fw.Write(content); err != nil {
		t.Fatalf("write file content: %v", err)
	}
	w.Close()

	req := httptest.NewRequest(http.MethodPost, "/upload", &buf)
	req.Header.Set("Content-Type", w.FormDataContentType())
	return req
}

func TestUploadImageHandler_NoFile(t *testing.T) {
	r := newUploadRouter()
	w := httptest.NewRecorder()
	// Send an empty multipart body — no file field at all
	var buf bytes.Buffer
	mw := multipart.NewWriter(&buf)
	mw.Close()
	req := httptest.NewRequest(http.MethodPost, "/upload", &buf)
	req.Header.Set("Content-Type", mw.FormDataContentType())
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("want 400, got %d", w.Code)
	}
}

func TestUploadImageHandler_NoContentType(t *testing.T) {
	r := newUploadRouter()
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/upload", strings.NewReader("not multipart"))
	// No Content-Type header — Gin can't parse a multipart form
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("want 400, got %d", w.Code)
	}
}

func TestUploadImageHandler_FileTooLarge(t *testing.T) {
	r := newUploadRouter()
	w := httptest.NewRecorder()

	// Create a file that is exactly one byte over the limit
	oversized := make([]byte, MaxFileSize+1)
	req := multipartRequest(t, "file", "big.jpg", oversized)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusRequestEntityTooLarge {
		t.Errorf("want 413, got %d", w.Code)
	}
}

func TestUploadImageHandler_FileAtLimit(t *testing.T) {
	r := newUploadRouter()
	w := httptest.NewRecorder()

	// A file exactly at the limit should pass the size check (it will fail later
	// on image decoding since it's not a real image, but must not return 413).
	atLimit := make([]byte, MaxFileSize)
	req := multipartRequest(t, "file", "exact.jpg", atLimit)
	r.ServeHTTP(w, req)

	if w.Code == http.StatusRequestEntityTooLarge {
		t.Errorf("file at exact limit should not be rejected with 413")
	}
}

func TestUploadImageHandler_WrongFieldName(t *testing.T) {
	r := newUploadRouter()
	w := httptest.NewRecorder()

	// Upload with a field named "image" instead of "file"
	req := multipartRequest(t, "image", "photo.jpg", []byte("data"))
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("want 400 for wrong field name, got %d", w.Code)
	}
}
