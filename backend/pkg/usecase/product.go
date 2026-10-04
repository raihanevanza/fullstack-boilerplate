package usecase

import (
	"context"
	"errors"

	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/apperr"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/constantvar"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/datasource"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/logger"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/model/entity"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/model/request"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/model/response"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/repository"

	"go.uber.org/zap"
)

type ProductUsecase interface {
	List(ctx context.Context, query request.ProductListQuery) (*response.PaginatedData[response.ProductResponse], error)
	Get(ctx context.Context, id int64) (*response.ProductResponse, error)
	Create(ctx context.Context, actor request.Actor, req request.ProductRequest) (*response.ProductResponse, error)
	Update(ctx context.Context, actor request.Actor, id int64, req request.ProductRequest) (*response.ProductResponse, error)
	Delete(ctx context.Context, actor request.Actor, id int64) error
}

type productUsecase struct {
	ProductRepository repository.ProductRepository
	AuditRepository   repository.AuditRepository
	Transactor        repository.Transactor
}

func NewProductUsecase(productRepository repository.ProductRepository, auditRepository repository.AuditRepository, transactor repository.Transactor) ProductUsecase {
	return &productUsecase{
		ProductRepository: productRepository,
		AuditRepository:   auditRepository,
		Transactor:        transactor,
	}
}

func (usecase *productUsecase) List(ctx context.Context, query request.ProductListQuery) (*response.PaginatedData[response.ProductResponse], error) {
	query.Normalize()

	rows, count, err := usecase.ProductRepository.List(ctx, query)
	if err != nil {
		logger.Error("list products", zap.Error(err))
		return nil, err
	}

	return &response.PaginatedData[response.ProductResponse]{
		Data:       response.NewProductResponses(rows),
		Pagination: response.Pagination{Count: count, Page: query.Page, Limit: query.Limit},
	}, nil
}

func (usecase *productUsecase) Get(ctx context.Context, id int64) (*response.ProductResponse, error) {
	product, err := usecase.find(ctx, id)
	if err != nil {
		return nil, err
	}

	resp := response.NewProductResponse(*product)
	return &resp, nil
}

func (usecase *productUsecase) Create(ctx context.Context, actor request.Actor, req request.ProductRequest) (*response.ProductResponse, error) {
	product := entity.Product{IsActive: true}
	applyProductRequest(req, &product)

	err := usecase.Transactor.WithTransaction(ctx, func(ctx context.Context) error {
		if err := usecase.ProductRepository.Create(ctx, &product); err != nil {
			return err
		}

		return usecase.AuditRepository.Log(ctx, actor, constantvar.AUDIT_CREATE, constantvar.ENTITY_PRODUCT, product.ID,
			nil, response.NewProductResponse(product))
	})
	if err != nil {
		return nil, usecase.writeError("create product", product.Sku, err)
	}

	return usecase.Get(ctx, product.ID)
}

func (usecase *productUsecase) Update(ctx context.Context, actor request.Actor, id int64, req request.ProductRequest) (*response.ProductResponse, error) {
	var sku string
	err := usecase.Transactor.WithTransaction(ctx, func(ctx context.Context) error {
		product, err := usecase.find(ctx, id)
		if err != nil {
			return err
		}

		before := response.NewProductResponse(*product)
		applyProductRequest(req, product)
		sku = product.Sku

		if err := usecase.ProductRepository.Update(ctx, product); err != nil {
			return err
		}

		return usecase.AuditRepository.Log(ctx, actor, constantvar.AUDIT_UPDATE, constantvar.ENTITY_PRODUCT, id,
			before, response.NewProductResponse(*product))
	})
	if err != nil {
		return nil, usecase.writeError("update product", sku, err)
	}

	return usecase.Get(ctx, id)
}

func (usecase *productUsecase) Delete(ctx context.Context, actor request.Actor, id int64) error {
	err := usecase.Transactor.WithTransaction(ctx, func(ctx context.Context) error {
		product, err := usecase.find(ctx, id)
		if err != nil {
			return err
		}

		deleted, err := usecase.ProductRepository.Delete(ctx, id)
		if err != nil {
			return err
		}
		if !deleted {
			return apperr.ErrNotFound
		}

		return usecase.AuditRepository.Log(ctx, actor, constantvar.AUDIT_DELETE, constantvar.ENTITY_PRODUCT, id,
			response.NewProductResponse(*product), nil)
	})
	if err != nil {
		return usecase.writeError("delete product", "", err)
	}

	return nil
}

// find loads a product or returns apperr.ErrNotFound.
func (usecase *productUsecase) find(ctx context.Context, id int64) (*entity.Product, error) {
	product, err := usecase.ProductRepository.FindByID(ctx, id)
	if err != nil {
		logger.Error("find product", zap.Error(err), zap.Int64("product_id", id))
		return nil, err
	}
	if product == nil {
		return nil, apperr.ErrNotFound
	}

	return product, nil
}

// writeError maps database errors from a write to API errors.
func (usecase *productUsecase) writeError(op, sku string, err error) error {
	if datasource.IsUniqueViolation(err) {
		return apperr.ErrDuplicate.WithMessage("msg.duplicate_sku", map[string]any{"Sku": sku})
	}

	var appErr *apperr.Error
	if !errors.As(err, &appErr) {
		logger.Error(op, zap.Error(err))
	}

	return err
}

// applyProductRequest copies a (normalized) request onto a new or existing
// product. When is_active is omitted the current value is kept, which is
// true for new products.
func applyProductRequest(req request.ProductRequest, product *entity.Product) {
	product.Sku = req.Sku
	product.Name = req.Name
	product.Description = req.Description
	if req.Price != nil {
		product.Price = *req.Price
	}
	if req.Stock != nil {
		product.Stock = *req.Stock
	}
	if req.IsActive != nil {
		product.IsActive = *req.IsActive
	}
}
