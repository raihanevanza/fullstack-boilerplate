package middleware

import (
	"net/url"
	"time"

	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/constantvar"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// corsHandler allows the origins in allowOrigins (empty = every origin).
// With allowLocalhost, any localhost origin is accepted as well, because dev
// servers move to another port when the default one is busy.
func corsHandler(allowOrigins []string, allowLocalhost bool) gin.HandlerFunc {
	config := cors.Config{
		AllowMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders: []string{
			"Origin", "Content-Type", constantvar.HEADER_AUTHORIZATION,
			constantvar.HEADER_ACCEPT_LANGUAGE, constantvar.HEADER_PLATFORM_TYPE,
		},
		MaxAge: 12 * time.Hour,
	}

	if len(allowOrigins) == 0 {
		config.AllowAllOrigins = true
		return cors.New(config)
	}

	allowed := make(map[string]bool, len(allowOrigins))
	for _, origin := range allowOrigins {
		allowed[origin] = true
	}
	config.AllowOriginFunc = func(origin string) bool {
		return allowed[origin] || (allowLocalhost && isLocalhost(origin))
	}

	return cors.New(config)
}

func isLocalhost(origin string) bool {
	u, err := url.Parse(origin)
	if err != nil || (u.Scheme != "http" && u.Scheme != "https") {
		return false
	}

	switch u.Hostname() {
	case "localhost", "127.0.0.1", "::1":
		return true
	}

	return false
}
