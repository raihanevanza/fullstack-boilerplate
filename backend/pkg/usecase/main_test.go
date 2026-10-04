package usecase_test

import (
	"context"
	"errors"

	mock_repository "github.com/raihanevanza/fullstack-boilerplate/backend/mock/repository"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/apperr"

	"go.uber.org/mock/gomock"
)

type txKey struct{}

// fakeTransactor runs the callback directly (no database) and marks the ctx,
// so tests can assert that repository calls happened inside the transaction.
func fakeTransactor(ctrl *gomock.Controller) *mock_repository.MockTransactor {
	trx := mock_repository.NewMockTransactor(ctrl)
	trx.EXPECT().WithTransaction(gomock.Any(), gomock.Any()).
		DoAndReturn(func(ctx context.Context, fn func(ctx context.Context) error) error {
			return fn(context.WithValue(ctx, txKey{}, true))
		}).
		AnyTimes()

	return trx
}

// inTx matches a ctx created by fakeTransactor.
var inTx = gomock.Cond(func(x any) bool {
	ctx, ok := x.(context.Context)
	return ok && ctx.Value(txKey{}) == true
})

func errCode(err error) string {
	var appErr *apperr.Error
	if errors.As(err, &appErr) {
		return appErr.Code
	}

	return ""
}
