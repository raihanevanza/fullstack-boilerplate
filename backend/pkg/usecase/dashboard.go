package usecase

import (
	"context"

	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/constantvar"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/logger"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/model/response"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/repository"

	"go.uber.org/zap"
)

type DashboardUsecase interface {
	Summary(ctx context.Context) (*response.DashboardResponse, error)
}

type dashboardUsecase struct {
	DashboardRepository repository.DashboardRepository
}

func NewDashboardUsecase(dashboardRepository repository.DashboardRepository) DashboardUsecase {
	return &dashboardUsecase{DashboardRepository: dashboardRepository}
}

func (usecase *dashboardUsecase) Summary(ctx context.Context) (*response.DashboardResponse, error) {
	stats, err := usecase.DashboardRepository.ProductStats(ctx, constantvar.LOW_STOCK_THRESHOLD)
	if err != nil {
		logger.Error("dashboard product stats", zap.Error(err))
		return nil, err
	}

	recent, err := usecase.DashboardRepository.RecentProducts(ctx, constantvar.DASHBOARD_RECENT_PRODUCTS)
	if err != nil {
		logger.Error("dashboard recent products", zap.Error(err))
		return nil, err
	}

	return &response.DashboardResponse{
		TotalProducts:    stats.TotalProducts,
		ActiveProducts:   stats.ActiveProducts,
		InactiveProducts: stats.InactiveProducts,
		LowStockProducts: stats.LowStockProducts,
		InventoryValue:   stats.InventoryValue,
		RecentProducts:   response.NewProductResponses(recent),
	}, nil
}
