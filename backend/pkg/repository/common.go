package repository

import (
	"context"
	"strings"

	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/datasource"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/model/entity"
)

type CommonRepository interface {
	// Ping runs a trivial query and returns the database clock (UTC).
	Ping(ctx context.Context) (*entity.Ping, error)
}

type commonRepository struct {
	Datasource *datasource.Datasource
}

func NewCommonRepository(ds *datasource.Datasource) CommonRepository {
	return &commonRepository{Datasource: ds}
}

func (repo *commonRepository) Ping(ctx context.Context) (*entity.Ping, error) {
	var ping entity.Ping
	if err := repo.Datasource.DB(ctx).Raw("SELECT SYSUTCDATETIME() AS CurrentDate").Scan(&ping).Error; err != nil {
		return nil, err
	}

	return &ping, nil
}

// escapeLike escapes SQL Server LIKE wildcards in user input.
func escapeLike(s string) string {
	return strings.NewReplacer("[", "[[]", "%", "[%]", "_", "[_]").Replace(s)
}
