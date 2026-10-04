// Package datasource owns the database connection and transaction handling.
//
// Transactions travel inside context.Context: WithTransaction stores the
// *gorm.DB transaction in the ctx it passes to the callback, and DB(ctx)
// returns that transaction when present. Repositories therefore never need a
// "tx" parameter; they always call ds.DB(ctx).
package datasource

import (
	"context"
	"errors"

	mssql "github.com/microsoft/go-mssqldb"
	"gorm.io/gorm"
)

type Datasource struct {
	GormDB *gorm.DB
}

type txKey struct{}

// DB returns the transaction stored in ctx, or the regular connection.
func (ds *Datasource) DB(ctx context.Context) *gorm.DB {
	if tx, ok := ctx.Value(txKey{}).(*gorm.DB); ok {
		return tx
	}

	return ds.GormDB.WithContext(ctx)
}

// WithTransaction runs fn inside one database transaction. Every repository
// call made with the ctx given to fn joins that transaction. The transaction
// is rolled back when fn returns an error or panics, and committed otherwise.
// Nested calls reuse the outer transaction.
func (ds *Datasource) WithTransaction(ctx context.Context, fn func(ctx context.Context) error) error {
	if _, ok := ctx.Value(txKey{}).(*gorm.DB); ok {
		return fn(ctx)
	}

	return ds.GormDB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		return fn(context.WithValue(ctx, txKey{}, tx))
	})
}

// Ping checks that the database answers.
func (ds *Datasource) Ping(ctx context.Context) error {
	sqlDB, err := ds.GormDB.DB()
	if err != nil {
		return err
	}

	return sqlDB.PingContext(ctx)
}

// Close closes the underlying connection pool.
func (ds *Datasource) Close() error {
	sqlDB, err := ds.GormDB.DB()
	if err != nil {
		return err
	}

	return sqlDB.Close()
}

// SQL Server error numbers for unique constraint (2627) and unique index
// (2601) violations. Filtered indexes such as
// "CREATE UNIQUE INDEX ... WHERE DeletedAt IS NULL" raise 2601.
const (
	mssqlUniqueIndexViolation      = 2601
	mssqlUniqueConstraintViolation = 2627
)

// IsUniqueViolation reports whether err is a SQL Server duplicate-key error.
func IsUniqueViolation(err error) bool {
	var mssqlErr mssql.Error
	if errors.As(err, &mssqlErr) {
		return mssqlErr.Number == mssqlUniqueIndexViolation || mssqlErr.Number == mssqlUniqueConstraintViolation
	}

	return false
}
