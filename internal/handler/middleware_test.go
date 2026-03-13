package handler

import (
	"encoding/json"
	"image-processing-service/internal/auth"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

// newAuthRouter registers AuthMiddleware followed by a trivial 200 handler.
func newAuthRouter() *gin.Engine {
	r := gin.New()
	r.GET("/protected", AuthMiddleware(), func(c *gin.Context) {
		userID, _ := c.Get("userID")
		c.JSON(http.StatusOK, gin.H{"user_id": userID})
	})
	return r
}

func TestAuthMiddleware_MissingHeader(t *testing.T) {
	r := newAuthRouter()
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("want 401, got %d", w.Code)
	}
	assertErrorField(t, w, "Authorization header missing")
}

func TestAuthMiddleware_NoBearerPrefix(t *testing.T) {
	r := newAuthRouter()
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Token sometoken")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("want 401, got %d", w.Code)
	}
	assertErrorField(t, w, "Invalid authorization format")
}

func TestAuthMiddleware_InvalidToken(t *testing.T) {
	r := newAuthRouter()
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer this.is.not.valid")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("want 401, got %d", w.Code)
	}
}

func TestAuthMiddleware_EmptyBearerToken(t *testing.T) {
	r := newAuthRouter()
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer ")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("want 401, got %d", w.Code)
	}
}

func TestAuthMiddleware_ValidToken(t *testing.T) {
	token, err := auth.GenerateJWT("user-abc-123")
	if err != nil {
		t.Fatalf("GenerateJWT: %v", err)
	}

	r := newAuthRouter()
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("want 200, got %d", w.Code)
	}

	var body map[string]any
	if err := json.NewDecoder(w.Body).Decode(&body); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if body["user_id"] != "user-abc-123" {
		t.Errorf("want user_id %q, got %v", "user-abc-123", body["user_id"])
	}
}

func TestAuthMiddleware_SetsUserIDInContext(t *testing.T) {
	const userID = "user-xyz-789"
	token, err := auth.GenerateJWT(userID)
	if err != nil {
		t.Fatalf("GenerateJWT: %v", err)
	}

	var capturedID string
	r := gin.New()
	r.GET("/check", AuthMiddleware(), func(c *gin.Context) {
		id, _ := c.Get("userID")
		capturedID, _ = id.(string)
		c.Status(http.StatusOK)
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/check", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	r.ServeHTTP(w, req)

	if capturedID != userID {
		t.Errorf("want userID %q in context, got %q", userID, capturedID)
	}
}

// assertErrorField checks that the response body contains an "error" key with
// a message that contains the given substring.
func assertErrorField(t *testing.T, w *httptest.ResponseRecorder, contains string) {
	t.Helper()
	var body map[string]string
	if err := json.NewDecoder(w.Body).Decode(&body); err != nil {
		t.Fatalf("decode response body: %v", err)
	}
	msg, ok := body["error"]
	if !ok {
		t.Fatalf("response missing 'error' field; body: %v", body)
	}
	if contains != "" && !jsonContains(msg, contains) {
		t.Errorf("want error containing %q, got %q", contains, msg)
	}
}

func jsonContains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr ||
		len(s) > 0 && containsString(s, substr))
}

func containsString(s, sub string) bool {
	for i := range s {
		if i+len(sub) <= len(s) && s[i:i+len(sub)] == sub {
			return true
		}
	}
	return false
}
