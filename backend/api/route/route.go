// Package route maps URLs to controllers and installs middleware.
package route

import (
	"net/http"

	"github.com/raihanevanza/fullstack-boilerplate/backend/api/controller"
	"github.com/raihanevanza/fullstack-boilerplate/backend/api/middleware"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/apperr"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/constantvar"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/logger"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/model/response"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/token"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"go.uber.org/zap"
)

type Options struct {
	middleware.Options
	// Production switches gin to release mode and hides Swagger.
	Production bool
	// TrustedProxies whose X-Forwarded-For header is trusted (nil = none).
	TrustedProxies []string
}

// NewServer builds the gin engine with every route registered.
func NewServer(opts Options, c controller.Controller, tokenManager token.Manager) (*gin.Engine, error) {
	if opts.Production {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()
	router.HandleMethodNotAllowed = false
	if err := router.SetTrustedProxies(opts.TrustedProxies); err != nil {
		return nil, err
	}

	router.Use(gin.CustomRecovery(func(ctx *gin.Context, recovered any) {
		logger.Error("panic recovered", zap.Any("panic", recovered), zap.String("url.path", ctx.Request.URL.Path))
		response.Abort(ctx, apperr.ErrInternal)
	}))
	middleware.Register(router, opts.Options)

	router.NoRoute(func(ctx *gin.Context) {
		response.Fail(ctx, apperr.ErrNotFound.WithMessage("msg.route_not_found",
			map[string]any{"Method": ctx.Request.Method, "Path": ctx.Request.URL.Path}))
	})

	router.GET("/health", c.CommonController.Ping)

	api := router.Group("/api")
	api.POST("/auth/login", c.AuthController.Login)

	authed := api.Group("", middleware.Auth(tokenManager))
	authed.GET("/auth/me", c.AuthController.Me)
	authed.GET("/dashboard", c.DashboardController.Summary)
	routeProducts(authed.Group("/products"), c.ProductController)

	if !opts.Production {
		router.GET("/swagger", func(ctx *gin.Context) { ctx.Redirect(http.StatusFound, "/swagger/index.html") })
		router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	}

	return router, nil
}

// routeProducts: reads are open to every logged-in user, writes need
// product.write.
func routeProducts(group *gin.RouterGroup, c controller.ProductController) {
	write := middleware.Require(constantvar.PERM_PRODUCT_WRITE)

	group.GET("", c.List)
	group.GET("/:id", c.Get)
	group.POST("", write, c.Create)
	group.PUT("/:id", write, c.Update)
	group.DELETE("/:id", write, c.Delete)
}
