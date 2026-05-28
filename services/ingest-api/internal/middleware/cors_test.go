package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func performRequest(handler gin.HandlerFunc, method, path string, headers map[string]string) *httptest.ResponseRecorder {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(handler)
	router.Any(path, func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	req := httptest.NewRequest(method, path, nil)
	for key, value := range headers {
		req.Header.Set(key, value)
	}

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	return w
}

func TestCORSAllowsConfiguredOrigin(t *testing.T) {
	allowed := []string{"http://localhost:3001", "http://localhost:3000"}
	handler := CORS(allowed)

	w := performRequest(handler, http.MethodOptions, "/v1/events", map[string]string{
		"Origin": "http://localhost:3001",
	})

	if w.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", w.Code)
	}
	if got := w.Header().Get("Access-Control-Allow-Origin"); got != "http://localhost:3001" {
		t.Fatalf("expected allowed origin header, got %q", got)
	}
	if got := w.Header().Get("Access-Control-Allow-Credentials"); got != "true" {
		t.Fatalf("expected credentials header true, got %q", got)
	}
}

func TestCORSBlocksUnknownOrigin(t *testing.T) {
	handler := CORS([]string{"http://localhost:3001"})

	w := performRequest(handler, http.MethodPost, "/v1/events", map[string]string{
		"Origin": "http://evil.example",
	})

	if got := w.Header().Get("Access-Control-Allow-Origin"); got != "" {
		t.Fatalf("expected no allow-origin for unknown origin, got %q", got)
	}
}
