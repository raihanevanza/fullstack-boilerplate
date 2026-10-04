package repository

import (
	"context"

	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/datasource"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/model/entity"
)

type DashboardRepository interface {
	// ProductStats aggregates non-deleted products in a single query.
	ProductStats(ctx context.Context, lowStockThreshold int) (*entity.ProductStats, error)
	// RecentProducts returns the newest non-deleted products.
	RecentProducts(ctx context.Context, limit int) ([]entity.Product, error)
}

type dashboardRepository struct {
	Datasource *datasource.Datasource
}

func NewDashboardRepository(ds *datasource.Datasource) DashboardRepository {
	return &dashboardRepository{Datasource: ds}
}

const productStatsSQL = `
SELECT COUNT(*)                                                           AS TotalProducts,
       ISNULL(SUM(CASE WHEN IsActive = 1 THEN 1 ELSE 0 END), 0)           AS ActiveProducts,
       ISNULL(SUM(CASE WHEN IsActive = 0 THEN 1 ELSE 0 END), 0)           AS InactiveProducts,
       ISNULL(SUM(CASE WHEN IsActive = 1 AND Stock <= @threshold THEN 1 ELSE 0 END), 0) AS LowStockProducts,
       ISNULL(SUM(CASE WHEN IsActive = 1 THEN Price * Stock ELSE 0 END), 0) AS InventoryValue
  FROM dbo.Products
 WHERE DeletedAt IS NULL`

func (repo *dashboardRepository) ProductStats(ctx context.Context, lowStockThreshold int) (*entity.ProductStats, error) {
	var stats entity.ProductStats
	err := repo.Datasource.DB(ctx).Raw(productStatsSQL, map[string]any{"threshold": lowStockThreshold}).Scan(&stats).Error
	if err != nil {
		return nil, err
	}

	return &stats, nil
}

func (repo *dashboardRepository) RecentProducts(ctx context.Context, limit int) ([]entity.Product, error) {
	rows := []entity.Product{}
	err := repo.Datasource.DB(ctx).
		Order("CreatedAt DESC").Order("Id DESC").
		Limit(limit).
		Find(&rows).Error

	return rows, err
}
