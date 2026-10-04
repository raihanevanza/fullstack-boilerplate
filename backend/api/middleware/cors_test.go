package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func preflight(handler gin.HandlerFunc, origin string) *httptest.ResponseRecorder {
	router := gin.New()
	router.Use(handler)
	router.POST("/api/auth/login", func(ctx *gin.Context) { ctx.Status(http.StatusOK) })

	req := httptest.NewRequest(http.MethodOptions, "/api/auth/login", nil)
	req.Header.Set("Origin", origin)
	req.Header.Set("Access-Control-Request-Method", http.MethodPost)
	req.Header.Set("Access-Control-Request-Headers", "authorization,content-type,accept-language,x-platform")
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, req)

	return recorder
}

func TestCorsHandler(t *testing.T) {
	gin.SetMode(gin.TestMode)
	origins := []string{"https://app.example.com"}

	dev := corsHandler(origins, true)
	prod := corsHandler(origins, false)

	tests := []struct {
		name    string
		handler gin.HandlerFunc
		origin  string
		want    int
	}{
		{"dev: listed origin", dev, "https://app.example.com", http.StatusNoContent},
		{"dev: vite on another port", dev, "http://localhost:5174", http.StatusNoContent},
		{"dev: 127.0.0.1 preview", dev, "http://127.0.0.1:4174", http.StatusNoContent},
		{"dev: IPv6 loopback", dev, "http://[::1]:5173", http.StatusNoContent},
		{"dev: other domain rejected", dev, "https://evil.example.com", http.StatusForbidden},
		{"dev: fake localhost rejected", dev, "http://localhost.evil.com", http.StatusForbidden},
		{"dev: non-http scheme rejected", dev, "file://localhost", http.StatusForbidden},
		{"prod: listed origin", prod, "https://app.example.com", http.StatusNoContent},
		{"prod: localhost rejected", prod, "http://localhost:5173", http.StatusForbidden},
		{"no list: every origin allowed", corsHandler(nil, false), "https://anything.test", http.StatusNoContent},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			recorder := preflight(test.handler, test.origin)
			assert.Equal(t, test.want, recorder.Code)
			if test.want == http.StatusNoContent {
				assert.NotEmpty(t, recorder.Header().Get("Access-Control-Allow-Origin"))
				assert.Contains(t, recorder.Header().Get("Access-Control-Allow-Headers"), "X-Platform")
			}
		})
	}
}
