package usecase_test

import (
	"context"
	"testing"

	mock_repository "github.com/raihanevanza/fullstack-boilerplate/backend/mock/repository"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/constantvar"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/model/entity"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/usecase"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/mock/gomock"
)

func TestDashboardSummary(t *testing.T) {
	ctrl := gomock.NewController(t)
	repo := mock_repository.NewMockDashboardRepository(ctrl)
	repo.EXPECT().ProductStats(gomock.Any(), constantvar.LOW_STOCK_THRESHOLD).
		Return(&entity.ProductStats{TotalProducts: 12, ActiveProducts: 10, InactiveProducts: 2, LowStockProducts: 3, InventoryValue: 15250000}, nil)
	repo.EXPECT().RecentProducts(gomock.Any(), constantvar.DASHBOARD_RECENT_PRODUCTS).Return([]entity.Product{}, nil)

	resp, err := usecase.NewDashboardUsecase(repo).Summary(context.Background())
	require.NoError(t, err)
	assert.Equal(t, int64(3), resp.LowStockProducts)
	assert.Equal(t, 15250000.0, resp.InventoryValue)
	assert.NotNil(t, resp.RecentProducts) // serialized as [] not null
}
