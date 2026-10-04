package usecase

import (
	"context"
	"time"

	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/apperr"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/constantvar"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/logger"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/model/request"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/model/response"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/repository"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/token"

	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
)

type AuthUsecase interface {
	Login(ctx context.Context, req request.LoginRequest, ip string) (*response.LoginResponse, error)
	Me(ctx context.Context, actor request.Actor) (*response.UserResponse, error)
}

type authUsecase struct {
	UserRepository  repository.UserRepository
	AuditRepository repository.AuditRepository
	Transactor      repository.Transactor
	TokenManager    token.Manager
}

func NewAuthUsecase(userRepository repository.UserRepository, auditRepository repository.AuditRepository, transactor repository.Transactor, tokenManager token.Manager) AuthUsecase {
	return &authUsecase{
		UserRepository:  userRepository,
		AuditRepository: auditRepository,
		Transactor:      transactor,
		TokenManager:    tokenManager,
	}
}

// dummyHash is compared against when the email is unknown, so a failed login
// takes about the same time whether or not the account exists.
var dummyHash, _ = bcrypt.GenerateFromPassword([]byte("not-a-real-password"), bcrypt.DefaultCost)

func (usecase *authUsecase) Login(ctx context.Context, req request.LoginRequest, ip string) (*response.LoginResponse, error) {
	user, err := usecase.UserRepository.FindByEmail(ctx, req.Email)
	if err != nil {
		logger.Error("find user by email", zap.Error(err))
		return nil, err
	}

	if user == nil {
		_ = bcrypt.CompareHashAndPassword(dummyHash, []byte(req.Password))
		return nil, apperr.ErrInvalidCredential
	}
	if bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)) != nil {
		return nil, apperr.ErrInvalidCredential
	}
	if !user.IsActive {
		return nil, apperr.ErrUserInactive
	}

	accessToken, expiresAt, err := usecase.TokenManager.Issue(user.ID, user.FullName, user.Role.Code)
	if err != nil {
		logger.Error("issue access token", zap.Error(err))
		return nil, err
	}

	now := time.Now().UTC()
	actor := request.Actor{UserID: user.ID, FullName: user.FullName, Role: user.Role.Code, IP: ip}
	err = usecase.Transactor.WithTransaction(ctx, func(ctx context.Context) error {
		if err := usecase.UserRepository.UpdateLastLogin(ctx, user.ID, now); err != nil {
			return err
		}

		return usecase.AuditRepository.Log(ctx, actor, constantvar.AUDIT_LOGIN, constantvar.ENTITY_USER, user.ID, nil, nil)
	})
	if err != nil {
		logger.Error("record login", zap.Error(err), zap.Int64("user_id", user.ID))
		return nil, err
	}
	user.LastLoginAt = &now

	return &response.LoginResponse{
		AccessToken: accessToken,
		TokenType:   "Bearer",
		ExpiresAt:   expiresAt,
		User:        response.NewUserResponse(*user),
	}, nil
}

func (usecase *authUsecase) Me(ctx context.Context, actor request.Actor) (*response.UserResponse, error) {
	user, err := usecase.UserRepository.FindByID(ctx, actor.UserID)
	if err != nil {
		logger.Error("find user by id", zap.Error(err))
		return nil, err
	}
	if user == nil {
		return nil, apperr.ErrUnauthorized
	}
	if !user.IsActive {
		return nil, apperr.ErrUserInactive
	}

	resp := response.NewUserResponse(*user)
	return &resp, nil
}
