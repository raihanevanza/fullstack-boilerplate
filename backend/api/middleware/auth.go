package middleware

import (
	"strings"

	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/apperr"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/constantvar"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/model/request"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/model/response"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/token"

	"github.com/gin-gonic/gin"
)

// Auth requires "Authorization: Bearer <token>" and stores the request.Actor
// on the context. Missing, malformed, foreign or expired tokens get 401.
func Auth(tokenManager token.Manager) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		header := ctx.GetHeader(constantvar.HEADER_AUTHORIZATION)
		scheme, tokenString, found := strings.Cut(strings.TrimSpace(header), " ")
		if !found || !strings.EqualFold(scheme, "Bearer") || strings.TrimSpace(tokenString) == "" {
			response.Abort(ctx, apperr.ErrUnauthorized)
			return
		}

		claims, err := tokenManager.Parse(strings.TrimSpace(tokenString))
		if err != nil {
			response.Abort(ctx, apperr.ErrUnauthorized)
			return
		}

		userID, _ := claims.UserID()
		ctx.Set(constantvar.CONTEXT_ACTOR, request.Actor{
			UserID:   userID,
			FullName: claims.Name,
			Role:     claims.Role,
			IP:       ctx.ClientIP(),
		})
		ctx.Next()
	}
}

// Require rejects the request with 403 unless the actor's role grants
// permission (see constantvar.ROLE_PERMISSIONS). Use it after Auth.
func Require(permission string) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		if !GetActor(ctx).Can(permission) {
			response.Abort(ctx, apperr.ErrForbidden)
			return
		}

		ctx.Next()
	}
}

// GetActor returns the authenticated user, or a zero Actor.
func GetActor(ctx *gin.Context) request.Actor {
	if value, ok := ctx.Get(constantvar.CONTEXT_ACTOR); ok {
		if actor, ok := value.(request.Actor); ok {
			return actor
		}
	}

	return request.Actor{}
}
