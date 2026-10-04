// Package registry wires repositories, use cases and controllers together
// (manual dependency injection).
package registry

import (
	"github.com/raihanevanza/fullstack-boilerplate/backend/api/controller"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/datasource"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/repository"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/token"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/usecase"
	"github.com/raihanevanza/fullstack-boilerplate/backend/utils"
)

type Registry interface {
	NewController() controller.Controller
	TokenManager() token.Manager
}

type registry struct {
	datasource   *datasource.Datasource
	tokenManager token.Manager
}

func NewRegistry(ds *datasource.Datasource, conf *utils.Config) Registry {
	return &registry{
		datasource:   ds,
		tokenManager: token.NewManager(conf.Jwt.Secret, conf.JwtTTL(), conf.ServiceName),
	}
}

func (r *registry) TokenManager() token.Manager {
	return r.tokenManager
}

func (r *registry) NewController() controller.Controller {
	ds := r.datasource

	// Repositories
	trx := repository.NewTransactor(ds)
	auditRepo := repository.NewAuditRepository(ds)
	userRepo := repository.NewUserRepository(ds)
	productRepo := repository.NewProductRepository(ds)

	return controller.Controller{
		CommonController: controller.NewCommonController(
			usecase.NewCommonUsecase(repository.NewCommonRepository(ds)),
		),
		AuthController: controller.NewAuthController(
			usecase.NewAuthUsecase(userRepo, auditRepo, trx, r.tokenManager),
		),
		DashboardController: controller.NewDashboardController(
			usecase.NewDashboardUsecase(repository.NewDashboardRepository(ds)),
		),
		ProductController: controller.NewProductController(
			usecase.NewProductUsecase(productRepo, auditRepo, trx),
		),
	}
}
