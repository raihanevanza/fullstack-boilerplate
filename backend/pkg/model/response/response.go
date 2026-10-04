// Package response builds the JSON envelope shared by every endpoint:
//
//	{ "error": null | {error_code, title, message}, "message": "success" | null, "data": ... }
package response

import (
	"net/http"

	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/apperr"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/logger"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/model/request"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

const MESSAGE_SUCCESS = "success"

type Error struct {
	ErrorCode string `json:"error_code" example:"err_not_found"`
	Title     string `json:"title" example:"Not found"`
	Message   string `json:"message" example:"The data you are looking for does not exist."`
}

type Response struct {
	Error   *Error  `json:"error"`
	Message *string `json:"message" example:"success"`
	Data    any     `json:"data"`
}

// Success writes 200 with data.
func Success(ctx *gin.Context, data any) {
	write(ctx, http.StatusOK, data)
}

// Created writes 201 with data.
func Created(ctx *gin.Context, data any) {
	write(ctx, http.StatusCreated, data)
}

func write(ctx *gin.Context, status int, data any) {
	message := MESSAGE_SUCCESS
	ctx.JSON(status, Response{Message: &message, Data: data})
}

// Reply writes err as a failure, or data as 200 when err is nil.
func Reply[T any](ctx *gin.Context, data T, err error) {
	if err != nil {
		Fail(ctx, err)
		return
	}

	Success(ctx, data)
}

// Fail writes err using the error envelope. An *apperr.Error keeps its own
// status and code; anything else is logged and hidden behind a generic 500.
func Fail(ctx *gin.Context, err error) {
	appErr, ok := apperr.From(err)
	if !ok {
		logger.Error("unhandled error",
			zap.Error(err),
			zap.String("http.request.method", ctx.Request.Method),
			zap.String("url.path", ctx.Request.URL.Path))
		appErr = apperr.ErrInternal
	}

	ctx.JSON(appErr.Status, Response{Error: toError(ctx, appErr)})
}

// Abort writes err and stops the handler chain. Used by middleware.
func Abort(ctx *gin.Context, err *apperr.Error) {
	Fail(ctx, err)
	ctx.Abort()
}

func toError(ctx *gin.Context, err *apperr.Error) *Error {
	lang := request.GetLanguage(ctx)

	return &Error{ErrorCode: err.Code, Title: err.Title(lang), Message: err.Message(lang)}
}
