package controller

import (
	"context"

	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/model/request"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/model/response"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/usecase"

	"github.com/gin-gonic/gin"
)

type ProductController interface {
	List(ginCtx *gin.Context)
	Get(ginCtx *gin.Context)
	Create(ginCtx *gin.Context)
	Update(ginCtx *gin.Context)
	Delete(ginCtx *gin.Context)
}

type productController struct {
	ProductUsecase usecase.ProductUsecase
}

func NewProductController(productUsecase usecase.ProductUsecase) ProductController {
	return &productController{ProductUsecase: productUsecase}
}

// List godoc
//
//	@Summary		List products
//	@Description	Newest first. search matches SKU or name.
//	@ID				get-products
//	@Tags			product
//	@Produce		json
//	@Security		BearerAuth
//	@Param			page		query		int		false	"Page (default 1)"						minimum(1)
//	@Param			limit		query		int		false	"Page size (default 20, max 100)"		minimum(1)	maximum(100)
//	@Param			search		query		string	false	"Matches SKU or name (max 100 chars)"	maxlength(100)
//	@Param			active_only	query		bool	false	"Only active products"
//	@Success		200			{object}	response.Response{data=response.PaginatedData[response.ProductResponse]}
//	@Failure		400			{object}	response.Response
//	@Failure		401			{object}	response.Response
//	@Router			/api/products [get]
func (controller *productController) List(ginCtx *gin.Context) {
	var query request.ProductListQuery
	if err := request.BindQuery(ginCtx, &query); err != nil {
		response.Fail(ginCtx, err)
		return
	}

	ctx, cancel := context.WithTimeout(ginCtx, TIMEOUT)
	defer cancel()

	resp, err := controller.ProductUsecase.List(ctx, query)
	response.Reply(ginCtx, resp, err)
}

// Get godoc
//
//	@Summary	Get a product
//	@ID			get-product
//	@Tags		product
//	@Produce	json
//	@Security	BearerAuth
//	@Param		id	path		int	true	"Product ID"
//	@Success	200	{object}	response.Response{data=response.ProductResponse}
//	@Failure	400	{object}	response.Response
//	@Failure	404	{object}	response.Response
//	@Router		/api/products/{id} [get]
func (controller *productController) Get(ginCtx *gin.Context) {
	id, err := request.PathID(ginCtx, "id")
	if err != nil {
		response.Fail(ginCtx, err)
		return
	}

	ctx, cancel := context.WithTimeout(ginCtx, TIMEOUT)
	defer cancel()

	resp, err := controller.ProductUsecase.Get(ctx, id)
	response.Reply(ginCtx, resp, err)
}

// Create godoc
//
//	@Summary		Create a product
//	@Description	Requires the product.write permission. Writes an audit log in the same transaction.
//	@ID				post-product
//	@Tags			product
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			body	body		request.ProductRequest	true	"Product"
//	@Success		201		{object}	response.Response{data=response.ProductResponse}
//	@Failure		400		{object}	response.Response
//	@Failure		403		{object}	response.Response
//	@Failure		409		{object}	response.Response	"err_duplicate (SKU already used)"
//	@Router			/api/products [post]
func (controller *productController) Create(ginCtx *gin.Context) {
	var req request.ProductRequest
	if err := request.BindJSON(ginCtx, &req); err != nil {
		response.Fail(ginCtx, err)
		return
	}

	ctx, cancel := context.WithTimeout(ginCtx, TIMEOUT)
	defer cancel()

	resp, err := controller.ProductUsecase.Create(ctx, actor(ginCtx), req)
	if err != nil {
		response.Fail(ginCtx, err)
		return
	}

	response.Created(ginCtx, resp)
}

// Update godoc
//
//	@Summary		Update a product
//	@Description	Requires the product.write permission. Omitting is_active keeps the current value.
//	@ID				put-product
//	@Tags			product
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id		path		int						true	"Product ID"
//	@Param			body	body		request.ProductRequest	true	"Product"
//	@Success		200		{object}	response.Response{data=response.ProductResponse}
//	@Failure		400		{object}	response.Response
//	@Failure		403		{object}	response.Response
//	@Failure		404		{object}	response.Response
//	@Failure		409		{object}	response.Response
//	@Router			/api/products/{id} [put]
func (controller *productController) Update(ginCtx *gin.Context) {
	id, err := request.PathID(ginCtx, "id")
	if err != nil {
		response.Fail(ginCtx, err)
		return
	}

	var req request.ProductRequest
	if err := request.BindJSON(ginCtx, &req); err != nil {
		response.Fail(ginCtx, err)
		return
	}

	ctx, cancel := context.WithTimeout(ginCtx, TIMEOUT)
	defer cancel()

	resp, err := controller.ProductUsecase.Update(ctx, actor(ginCtx), id, req)
	response.Reply(ginCtx, resp, err)
}

// Delete godoc
//
//	@Summary		Delete a product (soft delete)
//	@Description	Requires the product.write permission. data is null on success.
//	@ID				delete-product
//	@Tags			product
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path		int	true	"Product ID"
//	@Success		200	{object}	response.Response
//	@Failure		403	{object}	response.Response
//	@Failure		404	{object}	response.Response
//	@Router			/api/products/{id} [delete]
func (controller *productController) Delete(ginCtx *gin.Context) {
	id, err := request.PathID(ginCtx, "id")
	if err != nil {
		response.Fail(ginCtx, err)
		return
	}

	ctx, cancel := context.WithTimeout(ginCtx, TIMEOUT)
	defer cancel()

	err = controller.ProductUsecase.Delete(ctx, actor(ginCtx), id)
	response.Reply[any](ginCtx, nil, err)
}
