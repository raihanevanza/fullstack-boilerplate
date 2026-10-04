package request

import "strings"

type ProductListQuery struct {
	PaginationQuery
	// true = only products with is_active = true
	ActiveOnly bool `form:"active_only"`
}

// ProductRequest is the body of POST /api/products and PUT /api/products/:id.
// Price and Stock are pointers so that 0 is accepted while a missing value
// still fails "required".
type ProductRequest struct {
	Sku         string   `json:"sku" validate:"required,max=50" example:"PRD-0001"`
	Name        string   `json:"name" validate:"required,max=200" example:"Wireless Mouse"`
	Description *string  `json:"description" validate:"omitempty,max=500" example:"2.4 GHz, silent click"`
	Price       *float64 `json:"price" validate:"required,gte=0,lte=1000000000000" example:"99000"`
	Stock       *int     `json:"stock" validate:"required,gte=0,lte=2147483647" example:"25"`
	// Defaults to true on create. On update, omitting it keeps the current value.
	IsActive *bool `json:"is_active" example:"true"`
}

func (r *ProductRequest) Normalize() {
	r.Sku = strings.TrimSpace(r.Sku)
	r.Name = strings.TrimSpace(r.Name)
	r.Description = trimPtr(r.Description)
}
