// Package usecase contains business logic. Use cases depend on repository
// interfaces only, so they are unit-tested with the mocks in /mock.
package usecase

import (
	"context"

	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/apperr"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/logger"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/model/response"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/repository"

	"go.uber.org/zap"
)

type CommonUsecase interface {
	Ping(ctx context.Context) (*response.PingResponse, error)
}

type commonUsecase struct {
	CommonRepository repository.CommonRepository
}

func NewCommonUsecase(commonRepository repository.CommonRepository) CommonUsecase {
	return &commonUsecase{CommonRepository: commonRepository}
}

func (usecase *commonUsecase) Ping(ctx context.Context) (*response.PingResponse, error) {
	ping, err := usecase.CommonRepository.Ping(ctx)
	if err != nil {
		logger.Error("ping database", zap.Error(err))
		return nil, apperr.ErrServiceUnavailable
	}

	return &response.PingResponse{Status: "ok", Message: "pong", CurrentDate: ping.CurrentDate.UTC()}, nil
}
