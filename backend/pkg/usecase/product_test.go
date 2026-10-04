package usecase_test

import (
	"context"
	"testing"
	"time"

	mock_repository "github.com/raihanevanza/fullstack-boilerplate/backend/mock/repository"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/apperr"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/constantvar"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/model/entity"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/model/request"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/model/response"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/usecase"

	mssql "github.com/microsoft/go-mssqldb"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/mock/gomock"
)

var admin = request.Actor{UserID: 1, FullName: "Admin User", Role: constantvar.ROLE_ADMIN, IP: "127.0.0.1"}

type productMocks struct {
	products *mock_repository.MockProductRepository
	audit    *mock_repository.MockAuditRepository
	usecase  usecase.ProductUsecase
}

func newProductMocks(t *testing.T) productMocks {
	ctrl := gomock.NewController(t)
	m := productMocks{
		products: mock_repository.NewMockProductRepository(ctrl),
		audit:    mock_repository.NewMockAuditRepository(ctrl),
	}
	m.usecase = usecase.NewProductUsecase(m.products, m.audit, fakeTransactor(ctrl))

	return m
}

func ptr[T any](v T) *T { return &v }

func validProductRequest() request.ProductRequest {
	return request.ProductRequest{Sku: "PRD-0100", Name: "Webcam", Price: ptr(150000.0), Stock: ptr(0)}
}

func TestProductList(t *testing.T) {
	m := newProductMocks(t)
	m.products.EXPECT().List(gomock.Any(), gomock.Any()).
		DoAndReturn(func(_ context.Context, q request.ProductListQuery) ([]entity.Product, int64, error) {
			// defaults are applied before reaching the repository
			assert.Equal(t, 1, q.Page)
			assert.Equal(t, 20, q.Limit)
			assert.Equal(t, "mouse", q.Search)
			return []entity.Product{{ID: 2, Sku: "PRD-0002"}, {ID: 1, Sku: "PRD-0001"}}, 42, nil
		})

	resp, err := m.usecase.List(context.Background(), request.ProductListQuery{PaginationQuery: request.PaginationQuery{Search: " mouse "}})
	require.NoError(t, err)
	assert.Len(t, resp.Data, 2)
	assert.Equal(t, response.Pagination{Count: 42, Page: 1, Limit: 20}, resp.Pagination)
}

func TestProductGetNotFound(t *testing.T) {
	m := newProductMocks(t)
	m.products.EXPECT().FindByID(gomock.Any(), int64(99)).Return(nil, nil)

	_, err := m.usecase.Get(context.Background(), 99)
	assert.ErrorIs(t, err, apperr.ErrNotFound)
}

func TestProductCreate(t *testing.T) {
	t.Run("creates with is_active defaulting to true and audits in the same transaction", func(t *testing.T) {
		m := newProductMocks(t)
		created := time.Date(2026, 10, 4, 3, 0, 0, 0, time.UTC)

		m.products.EXPECT().Create(inTx, gomock.Any()).DoAndReturn(func(_ context.Context, p *entity.Product) error {
			assert.True(t, p.IsActive)
			assert.Equal(t, 0, p.Stock)
			p.ID, p.CreatedAt = 10, created
			return nil
		})
		m.audit.EXPECT().Log(inTx, admin, constantvar.AUDIT_CREATE, constantvar.ENTITY_PRODUCT, int64(10), nil, gomock.Any()).
			DoAndReturn(func(_ context.Context, _ request.Actor, _, _ string, _ int64, _, newValues any) error {
				assert.Equal(t, "PRD-0100", newValues.(response.ProductResponse).Sku)
				return nil
			})
		m.products.EXPECT().FindByID(gomock.Any(), int64(10)).Return(&entity.Product{ID: 10, Sku: "PRD-0100", IsActive: true, CreatedAt: created}, nil)

		resp, err := m.usecase.Create(context.Background(), admin, validProductRequest())
		require.NoError(t, err)
		assert.Equal(t, int64(10), resp.ID)
		assert.True(t, resp.IsActive)
	})

	t.Run("duplicate SKU (unique index violation) becomes err_duplicate", func(t *testing.T) {
		m := newProductMocks(t)
		m.products.EXPECT().Create(inTx, gomock.Any()).
			Return(mssql.Error{Number: 2601, Message: "Cannot insert duplicate key row"})

		_, err := m.usecase.Create(context.Background(), admin, validProductRequest())
		assert.ErrorIs(t, err, apperr.ErrDuplicate)
		appErr, _ := apperr.From(err)
		assert.Equal(t, "SKU PRD-0100 is already used by another product.", appErr.Message("en"))
	})

	t.Run("audit failure is returned so the transaction rolls back", func(t *testing.T) {
		m := newProductMocks(t)
		m.products.EXPECT().Create(inTx, gomock.Any()).Return(nil)
		m.audit.EXPECT().Log(inTx, gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any()).Return(assert.AnError)

		_, err := m.usecase.Create(context.Background(), admin, validProductRequest())
		assert.ErrorIs(t, err, assert.AnError)
	})
}

func TestProductUpdate(t *testing.T) {
	t.Run("not found", func(t *testing.T) {
		m := newProductMocks(t)
		m.products.EXPECT().FindByID(inTx, int64(5)).Return(nil, nil)

		_, err := m.usecase.Update(context.Background(), admin, 5, validProductRequest())
		assert.ErrorIs(t, err, apperr.ErrNotFound)
	})

	t.Run("keeps is_active when omitted and audits old and new values", func(t *testing.T) {
		m := newProductMocks(t)
		existing := &entity.Product{ID: 5, Sku: "PRD-0005", Name: "Old", Price: 1, Stock: 1, IsActive: false}

		m.products.EXPECT().FindByID(inTx, int64(5)).Return(existing, nil)
		m.products.EXPECT().Update(inTx, gomock.Any()).DoAndReturn(func(_ context.Context, p *entity.Product) error {
			assert.False(t, p.IsActive)
			assert.Equal(t, "Webcam", p.Name)
			return nil
		})
		m.audit.EXPECT().Log(inTx, admin, constantvar.AUDIT_UPDATE, constantvar.ENTITY_PRODUCT, int64(5), gomock.Any(), gomock.Any()).
			DoAndReturn(func(_ context.Context, _ request.Actor, _, _ string, _ int64, oldValues, newValues any) error {
				assert.Equal(t, "Old", oldValues.(response.ProductResponse).Name)
				assert.Equal(t, "Webcam", newValues.(response.ProductResponse).Name)
				return nil
			})
		m.products.EXPECT().FindByID(gomock.Any(), int64(5)).Return(&entity.Product{ID: 5, Name: "Webcam"}, nil)

		resp, err := m.usecase.Update(context.Background(), admin, 5, validProductRequest())
		require.NoError(t, err)
		assert.Equal(t, "Webcam", resp.Name)
	})

	t.Run("duplicate SKU", func(t *testing.T) {
		m := newProductMocks(t)
		m.products.EXPECT().FindByID(inTx, int64(5)).Return(&entity.Product{ID: 5}, nil)
		m.products.EXPECT().Update(inTx, gomock.Any()).Return(mssql.Error{Number: 2627})

		_, err := m.usecase.Update(context.Background(), admin, 5, validProductRequest())
		assert.Equal(t, apperr.ErrDuplicate.Code, errCode(err))
	})
}

func TestProductDelete(t *testing.T) {
	t.Run("not found", func(t *testing.T) {
		m := newProductMocks(t)
		m.products.EXPECT().FindByID(inTx, int64(8)).Return(nil, nil)

		assert.ErrorIs(t, m.usecase.Delete(context.Background(), admin, 8), apperr.ErrNotFound)
	})

	t.Run("soft deletes and audits in the same transaction", func(t *testing.T) {
		m := newProductMocks(t)
		m.products.EXPECT().FindByID(inTx, int64(8)).Return(&entity.Product{ID: 8, Sku: "PRD-0008"}, nil)
		m.products.EXPECT().Delete(inTx, int64(8)).Return(true, nil)
		m.audit.EXPECT().Log(inTx, admin, constantvar.AUDIT_DELETE, constantvar.ENTITY_PRODUCT, int64(8), gomock.Any(), nil).Return(nil)

		assert.NoError(t, m.usecase.Delete(context.Background(), admin, 8))
	})

	t.Run("row already deleted by a concurrent request", func(t *testing.T) {
		m := newProductMocks(t)
		m.products.EXPECT().FindByID(inTx, int64(8)).Return(&entity.Product{ID: 8}, nil)
		m.products.EXPECT().Delete(inTx, int64(8)).Return(false, nil)

		assert.ErrorIs(t, m.usecase.Delete(context.Background(), admin, 8), apperr.ErrNotFound)
	})
}
