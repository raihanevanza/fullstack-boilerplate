// Package middleware contains the global HTTP middleware (request logging,
// CORS, platform detection) and the auth/permission guards used by routes.
package middleware

import "github.com/gin-gonic/gin"

type Options struct {
	// CORS origins. Empty allows every origin.
	AllowOrigins []string
	// AllowLocalhost also accepts http(s)://localhost|127.0.0.1|[::1] on any
	// port. Enable it in development only.
	AllowLocalhost bool
}

// Register installs the global middleware on router, in order.
func Register(router *gin.Engine, opts Options) {
	router.Use(requestLogger(redactKeys{
		requestBody:  []string{"password"},
		responseBody: []string{"access_token"},
	}))
	router.Use(corsHandler(opts.AllowOrigins, opts.AllowLocalhost))
	router.Use(platformHandler())
}
