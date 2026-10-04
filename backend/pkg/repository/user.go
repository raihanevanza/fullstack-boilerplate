package repository

import (
	"context"
	"errors"
	"time"

	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/datasource"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/model/entity"

	"gorm.io/gorm"
)

type UserRepository interface {
	// FindByEmail returns (nil, nil) when no active (non-deleted) user matches.
	FindByEmail(ctx context.Context, email string) (*entity.User, error)
	// FindByID returns (nil, nil) when the user does not exist or was deleted.
	FindByID(ctx context.Context, id int64) (*entity.User, error)
	UpdateLastLogin(ctx context.Context, id int64, at time.Time) error
}

type userRepository struct {
	Datasource *datasource.Datasource
}

func NewUserRepository(ds *datasource.Datasource) UserRepository {
	return &userRepository{Datasource: ds}
}

func (repo *userRepository) find(ctx context.Context, query string, arg any) (*entity.User, error) {
	var user entity.User
	err := repo.Datasource.DB(ctx).Preload("Role").Where(query, arg).First(&user).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (repo *userRepository) FindByEmail(ctx context.Context, email string) (*entity.User, error) {
	return repo.find(ctx, "Email = ?", email)
}

func (repo *userRepository) FindByID(ctx context.Context, id int64) (*entity.User, error) {
	return repo.find(ctx, "Id = ?", id)
}

func (repo *userRepository) UpdateLastLogin(ctx context.Context, id int64, at time.Time) error {
	// UpdateColumn: do not touch UpdatedAt, a login is not a profile change.
	return repo.Datasource.DB(ctx).Model(&entity.User{}).Where("Id = ?", id).
		UpdateColumn("LastLoginAt", at).Error
}
