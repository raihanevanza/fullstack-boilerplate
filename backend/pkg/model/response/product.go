package response

import (
	"time"

	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/model/entity"
)

type ProductResponse struct {
	ID          int64      `json:"id" example:"1"`
	Sku         string     `json:"sku" example:"PRD-0001"`
	Name        string     `json:"name" example:"Wireless Mouse"`
	Description *string    `json:"description" example:"2.4 GHz, silent click"`
	Price       float64    `json:"price" example:"99000"`
	Stock       int        `json:"stock" example:"25"`
	IsActive    bool       `json:"is_active" example:"true"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   *time.Time `json:"updated_at"`
}

func NewProductResponse(p entity.Product) ProductResponse {
	return ProductResponse{
		ID:          p.ID,
		Sku:         p.Sku,
		Name:        p.Name,
		Description: p.Description,
		Price:       p.Price,
		Stock:       p.Stock,
		IsActive:    p.IsActive,
		CreatedAt:   p.CreatedAt.UTC(),
		UpdatedAt:   utcPtr(p.UpdatedAt),
	}
}

func NewProductResponses(rows []entity.Product) []ProductResponse {
	out := make([]ProductResponse, 0, len(rows))
	for _, row := range rows {
		out = append(out, NewProductResponse(row))
	}

	return out
}

type DashboardResponse struct {
	TotalProducts    int64 `json:"total_products" example:"12"`
	ActiveProducts   int64 `json:"active_products" example:"10"`
	InactiveProducts int64 `json:"inactive_products" example:"2"`
	// Active products with stock <= LOW_STOCK_THRESHOLD (10).
	LowStockProducts int64 `json:"low_stock_products" example:"3"`
	// Sum of price * stock over active products.
	InventoryValue float64 `json:"inventory_value" example:"15250000"`
	// Up to 5 products, newest first.
	RecentProducts []ProductResponse `json:"recent_products"`
}

func utcPtr(t *time.Time) *time.Time {
	if t == nil {
		return nil
	}

	u := t.UTC()
	return &u
}
