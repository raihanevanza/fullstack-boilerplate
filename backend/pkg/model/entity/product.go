package entity

import (
	"time"

	"gorm.io/gorm"
)

type Product struct {
	ID          int64     `gorm:"column:Id;primaryKey"`
	Sku         string    `gorm:"column:Sku"`
	Name        string    `gorm:"column:Name"`
	Description *string   `gorm:"column:Description"`
	Price       float64   `gorm:"column:Price"` // DECIMAL(18,2)
	Stock       int       `gorm:"column:Stock"`
	IsActive    bool      `gorm:"column:IsActive"`
	CreatedAt   time.Time `gorm:"column:CreatedAt"`
	// Set by ProductRepository.Update only, so a new product has updated_at = null.
	UpdatedAt *time.Time     `gorm:"column:UpdatedAt;autoUpdateTime:false"`
	DeletedAt gorm.DeletedAt `gorm:"column:DeletedAt"` // soft delete
}

func (Product) TableName() string { return "dbo.Products" }

// ProductStats is the aggregate row behind GET /api/dashboard.
type ProductStats struct {
	TotalProducts    int64   `gorm:"column:TotalProducts"`
	ActiveProducts   int64   `gorm:"column:ActiveProducts"`
	InactiveProducts int64   `gorm:"column:InactiveProducts"`
	LowStockProducts int64   `gorm:"column:LowStockProducts"`
	InventoryValue   float64 `gorm:"column:InventoryValue"`
}
