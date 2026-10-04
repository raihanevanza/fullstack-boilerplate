package controller_test

import (
	"net/http"
	"testing"

	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/apperr"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/constantvar"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/model/request"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/model/response"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/mock/gomock"
)

func TestLoginController(t *testing.T) {
	t.Run("invalid email is 400", func(t *testing.T) {
		s := newTestServer(t)
		status, resp := s.do(t, call{method: http.MethodPost, path: "/api/auth/login", body: `{"email":"nope","password":"x"}`})
		assert.Equal(t, http.StatusBadRequest, status)
		assert.Equal(t, "email must be a valid email address.", resp.Error.Message)
	})

	t.Run("wrong password is 401 in the requested language", func(t *testing.T) {
		s := newTestServer(t)
		s.auth.EXPECT().Login(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil, apperr.ErrInvalidCredential)

		status, resp := s.do(t, call{method: http.MethodPost, path: "/api/auth/login", body: `{"email":"a@example.com","password":"x"}`, lang: "id"})
		assert.Equal(t, http.StatusUnauthorized, status)
		assert.Equal(t, "err_invalid_credential", resp.Error.ErrorCode)
		assert.Equal(t, "Login gagal", resp.Error.Title)
	})

	t.Run("success trims the email", func(t *testing.T) {
		s := newTestServer(t)
		s.auth.EXPECT().Login(gomock.Any(), request.LoginRequest{Email: "a@example.com", Password: "pw"}, gomock.Any()).
			Return(&response.LoginResponse{AccessToken: "t", TokenType: "Bearer"}, nil)

		status, resp := s.do(t, call{method: http.MethodPost, path: "/api/auth/login", body: `{"email":" a@example.com ","password":"pw"}`})
		assert.Equal(t, http.StatusOK, status)
		assert.Nil(t, resp.Error)
	})
}

func TestMeAndDashboardRequireToken(t *testing.T) {
	s := newTestServer(t)
	for _, path := range []string{"/api/auth/me", "/api/dashboard", "/api/products"} {
		status, resp := s.do(t, call{method: http.MethodGet, path: path})
		assert.Equal(t, http.StatusUnauthorized, status, path)
		assert.Equal(t, "err_unauthorized", resp.Error.ErrorCode, path)
	}

	s.auth.EXPECT().Me(gomock.Any(), gomock.Any()).
		DoAndReturn(func(_ any, actor request.Actor) (*response.UserResponse, error) {
			return &response.UserResponse{ID: actor.UserID, Role: actor.Role, Permissions: constantvar.Permissions(actor.Role)}, nil
		})
	status, resp := s.do(t, call{method: http.MethodGet, path: "/api/auth/me", auth: s.bearer(t, constantvar.ROLE_ADMIN)})
	require.Equal(t, http.StatusOK, status)
	assert.Equal(t, []any{constantvar.PERM_PRODUCT_WRITE}, resp.Data.(map[string]any)["permissions"])
}
