package repository

import (
	"context"
	"errors"
	"time"

	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/datasource"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/model/entity"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/model/request"

	"gorm.io/gorm"
)

// ProductRepository reads and writes dbo.Products. Soft-deleted rows
// (DeletedAt IS NOT NULL) are invisible to every method.
type ProductRepository interface {
	// List returns one page of products (newest first) and the total count.
	List(ctx context.Context, query request.ProductListQuery) ([]entity.Product, int64, error)
	// FindByID returns (nil, nil) when the product does not exist.
	FindByID(ctx context.Context, id int64) (*entity.Product, error)
	Create(ctx context.Context, product *entity.Product) error
	Update(ctx context.Context, product *entity.Product) error
	// Delete soft-deletes the product and reports whether a row was affected.
	Delete(ctx context.Context, id int64) (bool, error)
}

type productRepository struct {
	Datasource *datasource.Datasource
}

func NewProductRepository(ds *datasource.Datasource) ProductRepository {
	return &productRepository{Datasource: ds}
}

func (repo *productRepository) List(ctx context.Context, query request.ProductListQuery) ([]entity.Product, int64, error) {
	db := repo.Datasource.DB(ctx).Model(&entity.Product{})

	if query.Search != "" {
		pattern := "%" + escapeLike(query.Search) + "%"
		db = db.Where("(Sku LIKE ? OR Name LIKE ?)", pattern, pattern)
	}
	if query.ActiveOnly {
		db = db.Where("IsActive = ?", true)
	}

	var count int64
	if err := db.Count(&count).Error; err != nil {
		return nil, 0, err
	}

	rows := []entity.Product{}
	if count == 0 {
		return rows, 0, nil
	}

	err := db.Order("CreatedAt DESC").Order("Id DESC").
		Offset(query.Offset()).Limit(query.Limit).
		Find(&rows).Error

	return rows, count, err
}

func (repo *productRepository) FindByID(ctx context.Context, id int64) (*entity.Product, error) {
	var product entity.Product
	err := repo.Datasource.DB(ctx).Where("Id = ?", id).First(&product).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &product, nil
}

func (repo *productRepository) Create(ctx context.Context, product *entity.Product) error {
	return repo.Datasource.DB(ctx).Create(product).Error
}

func (repo *productRepository) Update(ctx context.Context, product *entity.Product) error {
	now := time.Now().UTC()
	product.UpdatedAt = &now

	// Select("*") so zero values (stock 0, is_active false) are written too.
	return repo.Datasource.DB(ctx).Model(product).
		Select("*").Omit("Id", "CreatedAt", "DeletedAt").
		Updates(product).Error
}

func (repo *productRepository) Delete(ctx context.Context, id int64) (bool, error) {
	res := repo.Datasource.DB(ctx).Delete(&entity.Product{}, id)
	return res.RowsAffected > 0, res.Error
}
