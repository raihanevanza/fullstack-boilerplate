// Package repository holds data access. Every method takes a ctx and calls
// Datasource.DB(ctx), so it automatically joins a transaction started with
// Transactor.WithTransaction.
package repository

import (
	"context"

	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/datasource"
)

// Transactor lets a use case run several repository calls atomically:
//
//	err := trx.WithTransaction(ctx, func(ctx context.Context) error {
//		if err := products.Create(ctx, &p); err != nil {
//			return err // rollback
//		}
//		return audit.Log(ctx, ...) // same transaction
//	})
type Transactor interface {
	WithTransaction(ctx context.Context, fn func(ctx context.Context) error) error
}

func NewTransactor(ds *datasource.Datasource) Transactor {
	return ds
}
