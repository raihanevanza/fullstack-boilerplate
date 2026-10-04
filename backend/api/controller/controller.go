// Package controller contains the HTTP handlers. A handler only binds and
// validates input, calls one use case method and writes the response; all
// business rules live in pkg/usecase.
package controller

import (
	"time"

	"github.com/raihanevanza/fullstack-boilerplate/backend/api/middleware"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/model/request"

	"github.com/gin-gonic/gin"
)

// TIMEOUT bounds the time a handler may spend in use cases and the database.
const TIMEOUT = 15 * time.Second

// Controller groups every controller; it is built by api/registry and wired
// to URLs by api/route.
type Controller struct {
	CommonController    CommonController
	AuthController      AuthController
	DashboardController DashboardController
	ProductController   ProductController
}

func actor(ginCtx *gin.Context) request.Actor {
	return middleware.GetActor(ginCtx)
}
