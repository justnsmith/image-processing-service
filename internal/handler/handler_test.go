package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func init() {
	gin.SetMode(gin.TestMode)
}

// newRouter returns a minimal Gin engine with the given handler registered.
func newRouter(method, path string, h gin.HandlerFunc) *gin.Engine {
	r := gin.New()
	r.Handle(method, path, h)
	return r
}

// jsonBody serialises v as JSON and returns an io.Reader along with the content type.
func jsonBody(v any) *bytes.Buffer {
	b, _ := json.Marshal(v)
	return bytes.NewBuffer(b)
}

// ---- LoginHandler ---------------------------------------------------------------

func TestLoginHandler_InvalidJSON(t *testing.T) {
	r := newRouter(http.MethodPost, "/login", LoginHandler)
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/login", strings.NewReader("{invalid json"))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("want 400, got %d", w.Code)
	}
}

func TestLoginHandler_MissingFields(t *testing.T) {
	r := newRouter(http.MethodPost, "/login", LoginHandler)
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/login", jsonBody(map[string]string{}))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("want 400, got %d", w.Code)
	}
}

func TestLoginHandler_MissingPassword(t *testing.T) {
	r := newRouter(http.MethodPost, "/login", LoginHandler)
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/login",
		jsonBody(map[string]string{"email": "user@example.com"}))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("want 400, got %d", w.Code)
	}
}

// ---- RegisterHandler ------------------------------------------------------------

func TestRegisterHandler_InvalidJSON(t *testing.T) {
	r := newRouter(http.MethodPost, "/register", RegisterHandler)
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/register", strings.NewReader("{bad"))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("want 400, got %d", w.Code)
	}
}

func TestRegisterHandler_MissingFields(t *testing.T) {
	r := newRouter(http.MethodPost, "/register", RegisterHandler)
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/register", jsonBody(map[string]string{}))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("want 400, got %d", w.Code)
	}
}

func TestRegisterHandler_PasswordTooShort(t *testing.T) {
	r := newRouter(http.MethodPost, "/register", RegisterHandler)
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/register",
		jsonBody(map[string]string{
			"email":    "user@example.com",
			"password": "short",
		}))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("want 400, got %d", w.Code)
	}
}

func TestRegisterHandler_InvalidEmail(t *testing.T) {
	r := newRouter(http.MethodPost, "/register", RegisterHandler)
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/register",
		jsonBody(map[string]string{
			"email":    "notanemail",
			"password": "validpassword123",
		}))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("want 400, got %d", w.Code)
	}
}

// ---- VerifyEmailHandler ---------------------------------------------------------

func TestVerifyEmailHandler_InvalidJSON(t *testing.T) {
	r := newRouter(http.MethodPost, "/verify-email", VerifyEmailHandler)
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/verify-email", strings.NewReader("{bad"))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("want 400, got %d", w.Code)
	}
}

func TestVerifyEmailHandler_MissingToken(t *testing.T) {
	r := newRouter(http.MethodPost, "/verify-email", VerifyEmailHandler)
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/verify-email", jsonBody(map[string]string{}))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("want 400, got %d", w.Code)
	}
}

// ---- ResetPasswordHandler -------------------------------------------------------

func TestResetPasswordHandler_InvalidJSON(t *testing.T) {
	r := newRouter(http.MethodPost, "/reset-password", ResetPasswordHandler)
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/reset-password", strings.NewReader("{bad"))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("want 400, got %d", w.Code)
	}
}

func TestResetPasswordHandler_PasswordTooShort(t *testing.T) {
	r := newRouter(http.MethodPost, "/reset-password", ResetPasswordHandler)
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/reset-password",
		jsonBody(map[string]string{
			"token":        "somevalidtoken",
			"new_password": "short",
		}))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("want 400, got %d", w.Code)
	}
	var body map[string]string
	if err := json.NewDecoder(w.Body).Decode(&body); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if !strings.Contains(body["error"], "8 characters") {
		t.Errorf("want password length message, got %q", body["error"])
	}
}

// ---- ForgotPasswordHandler ------------------------------------------------------

func TestForgotPasswordHandler_InvalidJSON(t *testing.T) {
	r := newRouter(http.MethodPost, "/forgot-password", ForgotPasswordHandler)
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/forgot-password", strings.NewReader("{bad"))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("want 400, got %d", w.Code)
	}
}

func TestForgotPasswordHandler_MissingEmail(t *testing.T) {
	r := newRouter(http.MethodPost, "/forgot-password", ForgotPasswordHandler)
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/forgot-password", jsonBody(map[string]string{}))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("want 400, got %d", w.Code)
	}
}

// ---- HealthHandler --------------------------------------------------------------

func TestHealthHandler_ReturnsJSON(t *testing.T) {
	r := newRouter(http.MethodGet, "/health", HealthHandler)
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	r.ServeHTTP(w, req)

	// Should always return a valid JSON body, regardless of dependency state
	if w.Header().Get("Content-Type") != "application/json; charset=utf-8" {
		t.Errorf("want JSON content type, got %q", w.Header().Get("Content-Type"))
	}

	var body map[string]any
	if err := json.NewDecoder(w.Body).Decode(&body); err != nil {
		t.Fatalf("response is not valid JSON: %v", err)
	}
	if _, ok := body["status"]; !ok {
		t.Error("response missing 'status' field")
	}
	if _, ok := body["checks"]; !ok {
		t.Error("response missing 'checks' field")
	}
}

func TestHealthHandler_StatusCodeMatchesDependencies(t *testing.T) {
	r := newRouter(http.MethodGet, "/health", HealthHandler)
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	r.ServeHTTP(w, req)

	// In a test environment without real DB/Redis, the service is degraded (503).
	// Either outcome (200 or 503) is valid — what matters is the contract:
	// 200 ↔ status "ok", 503 ↔ status "degraded"
	var body map[string]any
	json.NewDecoder(w.Body).Decode(&body)

	status, _ := body["status"].(string)
	switch w.Code {
	case http.StatusOK:
		if status != "ok" {
			t.Errorf("200 response should have status 'ok', got %q", status)
		}
	case http.StatusServiceUnavailable:
		if status != "degraded" {
			t.Errorf("503 response should have status 'degraded', got %q", status)
		}
	default:
		t.Errorf("unexpected status code %d", w.Code)
	}
}
