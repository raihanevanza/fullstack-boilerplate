// Package request contains request DTOs (JSON bodies and query strings),
// their validation rules, and the authenticated Actor.
package request

import (
	"strings"

	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/constantvar"
)

// Actor is the authenticated user, set on the gin context by middleware.Auth.
type Actor struct {
	UserID   int64
	FullName string
	Role     string
	IP       string
}

// Can reports whether the actor's role grants permission.
func (a Actor) Can(permission string) bool {
	return constantvar.HasPermission(a.Role, permission)
}

// PaginationQuery is embedded by every list query.
type PaginationQuery struct {
	Page   int    `form:"page" validate:"omitempty,min=1" example:"1"`
	Limit  int    `form:"limit" validate:"omitempty,min=1,max=100" example:"20"`
	Search string `form:"search" validate:"omitempty,max=100"`
}

// Normalize applies defaults. It is called automatically by BindQuery.
func (q *PaginationQuery) Normalize() {
	if q.Page < 1 {
		q.Page = constantvar.DEFAULT_PAGE
	}
	if q.Limit < 1 {
		q.Limit = constantvar.DEFAULT_LIMIT
	}
	q.Search = strings.TrimSpace(q.Search)
}

func (q PaginationQuery) Offset() int {
	return (q.Page - 1) * q.Limit
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email,max=150" example:"admin@example.com"`
	Password string `json:"password" validate:"required,max=100" example:"Password123!"`
}

func (r *LoginRequest) Normalize() {
	r.Email = strings.TrimSpace(r.Email)
}

// trimPtr trims s and turns an empty result into nil.
func trimPtr(s *string) *string {
	if s == nil {
		return nil
	}

	v := strings.TrimSpace(*s)
	if v == "" {
		return nil
	}

	return &v
}
