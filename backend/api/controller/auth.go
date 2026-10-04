package controller

import (
	"context"

	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/model/request"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/model/response"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/usecase"

	"github.com/gin-gonic/gin"
)

type AuthController interface {
	Login(ginCtx *gin.Context)
	Me(ginCtx *gin.Context)
}

type authController struct {
	AuthUsecase usecase.AuthUsecase
}

func NewAuthController(authUsecase usecase.AuthUsecase) AuthController {
	return &authController{AuthUsecase: authUsecase}
}

// Login godoc
//
//	@Summary		Log in
//	@Description	Exchanges email and password for a JWT access token.
//	@ID				post-auth-login
//	@Tags			auth
//	@Accept			json
//	@Produce		json
//	@Param			Accept-Language	header		string					false	"en (default) or id"
//	@Param			body			body		request.LoginRequest	true	"Credentials"
//	@Success		200				{object}	response.Response{data=response.LoginResponse}
//	@Failure		400				{object}	response.Response
//	@Failure		401				{object}	response.Response	"err_invalid_credential"
//	@Failure		403				{object}	response.Response	"err_user_inactive"
//	@Router			/api/auth/login [post]
func (controller *authController) Login(ginCtx *gin.Context) {
	var req request.LoginRequest
	if err := request.BindJSON(ginCtx, &req); err != nil {
		response.Fail(ginCtx, err)
		return
	}

	ctx, cancel := context.WithTimeout(ginCtx, TIMEOUT)
	defer cancel()

	resp, err := controller.AuthUsecase.Login(ctx, req, ginCtx.ClientIP())
	response.Reply(ginCtx, resp, err)
}

// Me godoc
//
//	@Summary		Current user
//	@Description	Returns the logged-in user and the permissions of their role.
//	@ID				get-auth-me
//	@Tags			auth
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	response.Response{data=response.UserResponse}
//	@Failure		401	{object}	response.Response
//	@Router			/api/auth/me [get]
func (controller *authController) Me(ginCtx *gin.Context) {
	ctx, cancel := context.WithTimeout(ginCtx, TIMEOUT)
	defer cancel()

	resp, err := controller.AuthUsecase.Me(ctx, actor(ginCtx))
	response.Reply(ginCtx, resp, err)
}
