package middleware

import (
	"bytes"
	"encoding/json"
	"io"
	"time"

	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/logger"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

const (
	redactedValue = "[REDACTED]"
	// Bodies larger than this are logged truncated.
	maxLoggedBody = 4 << 10
)

// redactKeys lists JSON keys whose values must never reach the logs. Keys are
// matched at any depth.
type redactKeys struct {
	requestBody  []string
	responseBody []string
}

// recordingWriter keeps a copy of the response body for logging.
type recordingWriter struct {
	gin.ResponseWriter
	body *bytes.Buffer
}

func (w *recordingWriter) Write(b []byte) (int, error) {
	w.body.Write(b)
	return w.ResponseWriter.Write(b)
}

func (w *recordingWriter) WriteString(s string) (int, error) {
	w.body.WriteString(s)
	return w.ResponseWriter.WriteString(s)
}

// requestLogger writes one structured log entry per request with method,
// path, status, latency, client and (redacted) bodies.
func requestLogger(redact redactKeys) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		start := time.Now()

		var reqBody []byte
		if ctx.Request.Body != nil {
			reqBody, _ = io.ReadAll(ctx.Request.Body)
			ctx.Request.Body = io.NopCloser(bytes.NewReader(reqBody))
		}

		writer := &recordingWriter{ResponseWriter: ctx.Writer, body: &bytes.Buffer{}}
		ctx.Writer = writer

		ctx.Next()

		path := ctx.Request.URL.Path
		if raw := ctx.Request.URL.RawQuery; raw != "" {
			path += "?" + raw
		}

		fields := []zap.Field{
			zap.String("http.request.method", ctx.Request.Method),
			zap.String("url.path", path),
			zap.Int("http.response.status_code", ctx.Writer.Status()),
			zap.Int("http.response.body.bytes", ctx.Writer.Size()),
			zap.Duration("event.duration", time.Since(start)),
			zap.String("client.ip", ctx.ClientIP()),
			zap.String("user_agent.original", ctx.Request.UserAgent()),
			zap.String("platform", GetPlatform(ctx)),
			zap.Reflect("request_body", loggableBody(reqBody, redact.requestBody)),
			zap.Reflect("response_body", loggableBody(writer.body.Bytes(), redact.responseBody)),
		}
		if actor := GetActor(ctx); actor.UserID > 0 {
			fields = append(fields, zap.Int64("user.id", actor.UserID))
		}
		if len(ctx.Errors) > 0 {
			fields = append(fields, zap.String("error.message", ctx.Errors.String()))
		}

		logger.Info("http request", fields...)
	}
}

// loggableBody parses JSON bodies so they can be redacted and logged as
// nested objects; other or oversized bodies are logged as truncated text.
func loggableBody(body []byte, keys []string) any {
	if len(body) == 0 {
		return nil
	}

	var parsed any
	if err := json.Unmarshal(body, &parsed); err != nil {
		return truncate(body)
	}

	redactJSON(parsed, keys)
	if len(body) <= maxLoggedBody {
		return parsed
	}

	out, _ := json.Marshal(parsed)
	return truncate(out)
}

func redactJSON(node any, keys []string) {
	switch value := node.(type) {
	case map[string]any:
		for k, child := range value {
			if contains(keys, k) {
				value[k] = redactedValue
				continue
			}
			redactJSON(child, keys)
		}
	case []any:
		for _, child := range value {
			redactJSON(child, keys)
		}
	}
}

func contains(list []string, s string) bool {
	for _, item := range list {
		if item == s {
			return true
		}
	}

	return false
}

func truncate(b []byte) string {
	if len(b) > maxLoggedBody {
		return string(b[:maxLoggedBody]) + "...(truncated)"
	}

	return string(b)
}
