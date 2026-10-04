package controller

import (
	"context"

	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/model/response"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/usecase"

	"github.com/gin-gonic/gin"
)

type DashboardController interface {
	Summary(ginCtx *gin.Context)
}

type dashboardController struct {
	DashboardUsecase usecase.DashboardUsecase
}

func NewDashboardController(dashboardUsecase usecase.DashboardUsecase) DashboardController {
	return &dashboardController{DashboardUsecase: dashboardUsecase}
}

// Summary godoc
//
//	@Summary		Dashboard summary
//	@Description	Product counters, inventory value (sum of price * stock over active products) and the 5 newest products.
//	@ID				get-dashboard
//	@Tags			dashboard
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	response.Response{data=response.DashboardResponse}
//	@Failure		401	{object}	response.Response
//	@Router			/api/dashboard [get]
func (controller *dashboardController) Summary(ginCtx *gin.Context) {
	ctx, cancel := context.WithTimeout(ginCtx, TIMEOUT)
	defer cancel()

	resp, err := controller.DashboardUsecase.Summary(ctx)
	response.Reply(ginCtx, resp, err)
}
