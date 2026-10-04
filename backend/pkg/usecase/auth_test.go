package usecase_test

import (
	"context"
	"testing"
	"time"

	mock_repository "github.com/raihanevanza/fullstack-boilerplate/backend/mock/repository"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/apperr"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/constantvar"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/model/entity"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/model/request"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/token"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/usecase"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/mock/gomock"
	"golang.org/x/crypto/bcrypt"
)

const testSecret = "0123456789abcdef0123456789abcdef"

func TestLogin(t *testing.T) {
	hash, _ := bcrypt.GenerateFromPassword([]byte("secret123"), bcrypt.MinCost)
	activeAdmin := func() *entity.User {
		return &entity.User{ID: 7, FullName: "Ada Admin", Email: "ada@example.com", PasswordHash: string(hash), IsActive: true,
			Role: entity.Role{Code: constantvar.ROLE_ADMIN, Name: "Administrator"}}
	}
	tokens := token.NewManager(testSecret, time.Hour, "test")

	tests := []struct {
		name     string
		password string
		user     func() *entity.User
		auditErr error
		wantCode string
	}{
		{name: "unknown email", password: "secret123", user: func() *entity.User { return nil }, wantCode: apperr.ErrInvalidCredential.Code},
		{name: "wrong password", password: "wrong", user: activeAdmin, wantCode: apperr.ErrInvalidCredential.Code},
		{name: "inactive user", password: "secret123", user: func() *entity.User { u := activeAdmin(); u.IsActive = false; return u }, wantCode: apperr.ErrUserInactive.Code},
		{name: "audit failure fails the login", password: "secret123", user: activeAdmin, auditErr: assert.AnError},
		{name: "success", password: "secret123", user: activeAdmin},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			users := mock_repository.NewMockUserRepository(ctrl)
			audit := mock_repository.NewMockAuditRepository(ctrl)

			users.EXPECT().FindByEmail(gomock.Any(), "ada@example.com").Return(test.user(), nil)
			if test.wantCode == "" {
				// last login and audit are written in the same transaction
				users.EXPECT().UpdateLastLogin(inTx, int64(7), gomock.Any()).Return(nil)
				audit.EXPECT().Log(inTx, gomock.Any(), constantvar.AUDIT_LOGIN, constantvar.ENTITY_USER, int64(7), nil, nil).Return(test.auditErr)
			}

			req := request.LoginRequest{Email: " ada@example.com ", Password: test.password}
			req.Normalize()
			resp, err := usecase.NewAuthUsecase(users, audit, fakeTransactor(ctrl), tokens).Login(context.Background(), req, "127.0.0.1")

			if test.wantCode != "" {
				assert.Equal(t, test.wantCode, errCode(err))
				return
			}
			if test.auditErr != nil {
				assert.ErrorIs(t, err, test.auditErr)
				return
			}

			require.NoError(t, err)
			assert.Equal(t, "Bearer", resp.TokenType)
			assert.Equal(t, []string{constantvar.PERM_PRODUCT_WRITE}, resp.User.Permissions)
			assert.Equal(t, "Administrator", resp.User.RoleName)
			assert.NotNil(t, resp.User.LastLoginAt)

			claims, err := tokens.Parse(resp.AccessToken)
			require.NoError(t, err)
			assert.Equal(t, constantvar.ROLE_ADMIN, claims.Role)
			id, _ := claims.UserID()
			assert.Equal(t, int64(7), id)
		})
	}
}

func TestMe(t *testing.T) {
	staff := &entity.User{ID: 3, FullName: "Sam Staff", IsActive: true, Role: entity.Role{Code: constantvar.ROLE_STAFF, Name: "Staff"}}

	tests := []struct {
		name     string
		user     *entity.User
		wantCode string
	}{
		{name: "deleted user", user: nil, wantCode: apperr.ErrUnauthorized.Code},
		{name: "inactive user", user: &entity.User{ID: 3, IsActive: false}, wantCode: apperr.ErrUserInactive.Code},
		{name: "staff has no permissions", user: staff},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			users := mock_repository.NewMockUserRepository(ctrl)
			users.EXPECT().FindByID(gomock.Any(), int64(3)).Return(test.user, nil)

			resp, err := usecase.NewAuthUsecase(users, nil, nil, nil).Me(context.Background(), request.Actor{UserID: 3})
			if test.wantCode != "" {
				assert.Equal(t, test.wantCode, errCode(err))
				return
			}

			require.NoError(t, err)
			assert.Equal(t, constantvar.ROLE_STAFF, resp.Role)
			assert.NotNil(t, resp.Permissions)
			assert.Empty(t, resp.Permissions)
		})
	}
}
