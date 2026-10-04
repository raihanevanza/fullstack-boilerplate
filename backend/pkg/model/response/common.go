package response

import "time"

type PingResponse struct {
	Status      string    `json:"status" example:"ok"`
	Message     string    `json:"message" example:"pong"`
	CurrentDate time.Time `json:"current_date"`
}

type Pagination struct {
	// Total number of matching rows (not the page size).
	Count int64 `json:"count" example:"42"`
	Page  int   `json:"page" example:"1"`
	Limit int   `json:"limit" example:"20"`
}

type PaginatedData[T any] struct {
	Data       []T        `json:"data"`
	Pagination Pagination `json:"pagination"`
}
