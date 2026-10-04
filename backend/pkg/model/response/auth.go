package response

import (
	"time"

	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/constantvar"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/model/entity"
)

type UserResponse struct {
	ID          int64      `json:"id" example:"1"`
	FullName    string     `json:"full_name" example:"Admin User"`
	Email       string     `json:"email" example:"admin@example.com"`
	Role        string     `json:"role" example:"ADMIN"`
	RoleName    string     `json:"role_name" example:"Administrator"`
	LastLoginAt *time.Time `json:"last_login_at"`
	Permissions []string   `json:"permissions" example:"product.write"`
}

func NewUserResponse(u entity.User) UserResponse {
	return UserResponse{
		ID:          u.ID,
		FullName:    u.FullName,
		Email:       u.Email,
		Role:        u.Role.Code,
		RoleName:    u.Role.Name,
		LastLoginAt: utcPtr(u.LastLoginAt),
		Permissions: constantvar.Permissions(u.Role.Code),
	}
}

type LoginResponse struct {
	AccessToken string       `json:"access_token" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
	TokenType   string       `json:"token_type" example:"Bearer"`
	ExpiresAt   time.Time    `json:"expires_at"`
	User        UserResponse `json:"user"`
}
