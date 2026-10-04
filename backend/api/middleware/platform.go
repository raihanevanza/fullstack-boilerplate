package middleware

import (
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/constantvar"

	"github.com/gin-gonic/gin"
)

// platformHandler reads X-Platform (web | mobile, default web) and stores it
// on the context. It is only used for logging.
func platformHandler() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		platform := constantvar.HEADER_PLATFORM_TYPE_WEB
		if ctx.GetHeader(constantvar.HEADER_PLATFORM_TYPE) == constantvar.HEADER_PLATFORM_TYPE_MOBILE {
			platform = constantvar.HEADER_PLATFORM_TYPE_MOBILE
		}

		ctx.Set(constantvar.CONTEXT_PLATFORM_TYPE, platform)
		ctx.Next()
	}
}

// GetPlatform returns "web" or "mobile".
func GetPlatform(ctx *gin.Context) string {
	return ctx.GetString(constantvar.CONTEXT_PLATFORM_TYPE)
}
