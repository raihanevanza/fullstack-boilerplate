package controller

import (
	"context"

	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/model/response"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/usecase"

	"github.com/gin-gonic/gin"
)

type CommonController interface {
	Ping(ginCtx *gin.Context)
}

type commonController struct {
	CommonUsecase usecase.CommonUsecase
}

func NewCommonController(commonUsecase usecase.CommonUsecase) CommonController {
	return &commonController{CommonUsecase: commonUsecase}
}

// Ping godoc
//
//	@Summary		Health check
//	@Description	Pings the database. Returns 503 err_service_unavailable when the database is unreachable.
//	@ID				get-health
//	@Tags			health
//	@Produce		json
//	@Success		200	{object}	response.Response{data=response.PingResponse}
//	@Failure		503	{object}	response.Response
//	@Router			/health [get]
func (controller *commonController) Ping(ginCtx *gin.Context) {
	ctx, cancel := context.WithTimeout(ginCtx, TIMEOUT)
	defer cancel()

	resp, err := controller.CommonUsecase.Ping(ctx)
	response.Reply(ginCtx, resp, err)
}
