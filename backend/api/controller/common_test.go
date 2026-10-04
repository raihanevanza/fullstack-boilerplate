package controller_test

import (
	"net/http"
	"testing"
	"time"

	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/apperr"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/model/response"

	"github.com/stretchr/testify/assert"
	"go.uber.org/mock/gomock"
)

func TestHealth(t *testing.T) {
	t.Run("ok", func(t *testing.T) {
		s := newTestServer(t)
		s.common.EXPECT().Ping(gomock.Any()).Return(&response.PingResponse{Status: "ok", Message: "pong", CurrentDate: time.Now()}, nil)

		status, resp := s.do(t, call{method: http.MethodGet, path: "/health"})
		assert.Equal(t, http.StatusOK, status)
		assert.Equal(t, "pong", resp.Data.(map[string]any)["message"])
	})

	t.Run("database down", func(t *testing.T) {
		s := newTestServer(t)
		s.common.EXPECT().Ping(gomock.Any()).Return(nil, apperr.ErrServiceUnavailable)

		status, resp := s.do(t, call{method: http.MethodGet, path: "/health"})
		assert.Equal(t, http.StatusServiceUnavailable, status)
		assert.Equal(t, "err_service_unavailable", resp.Error.ErrorCode)
	})
}
