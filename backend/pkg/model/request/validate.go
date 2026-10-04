package request

import (
	"encoding/json"
	"errors"
	"io"
	"reflect"
	"strconv"
	"strings"
	"sync"

	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/apperr"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/constantvar"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/i18n"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

// Normalizer is implemented by requests that clean their input (trim spaces,
// apply defaults) before validation.
type Normalizer interface {
	Normalize()
}

var (
	validateOnce sync.Once
	validate     *validator.Validate
)

func getValidator() *validator.Validate {
	validateOnce.Do(func() {
		validate = validator.New(validator.WithRequiredStructEnabled())
		// Report fields by their JSON / query name ("sku", not "Sku").
		validate.RegisterTagNameFunc(func(field reflect.StructField) string {
			for _, tag := range []string{"json", "form"} {
				name := strings.Split(field.Tag.Get(tag), ",")[0]
				if name != "" && name != "-" {
					return name
				}
			}

			return field.Name
		})
	})

	return validate
}

// BindJSON decodes the JSON body into req, normalizes and validates it.
// The returned error is an *apperr.Error (bad_request) ready for the response.
func BindJSON(ctx *gin.Context, req any) error {
	if err := ctx.ShouldBindJSON(req); err != nil {
		var typeErr *json.UnmarshalTypeError
		if errors.As(err, &typeErr) && typeErr.Field != "" {
			return apperr.ErrBadRequest.WithMessage("validation.type", map[string]any{"Field": typeErr.Field})
		}

		return apperr.ErrBadRequest.WithMessage("validation.malformed_body", nil)
	}

	return check(req)
}

// BindQuery decodes the query string into req, normalizes and validates it.
func BindQuery(ctx *gin.Context, req any) error {
	if err := ctx.ShouldBindQuery(req); err != nil {
		return apperr.ErrBadRequest.WithMessage("validation.malformed_query", nil)
	}

	return check(req)
}

// PathID parses a positive integer path parameter (e.g. ":id").
func PathID(ctx *gin.Context, name string) (int64, error) {
	id, err := strconv.ParseInt(ctx.Param(name), 10, 64)
	if err != nil || id <= 0 {
		return 0, apperr.ErrBadRequest.WithMessage("validation.invalid_id", nil)
	}

	return id, nil
}

func check(req any) error {
	if n, ok := req.(Normalizer); ok {
		n.Normalize()
	}

	err := getValidator().Struct(req)
	if err == nil {
		return nil
	}

	var ve validator.ValidationErrors
	if errors.As(err, &ve) && len(ve) > 0 {
		return validationError(ve[0])
	}
	if errors.Is(err, io.EOF) {
		return apperr.ErrBadRequest.WithMessage("validation.malformed_body", nil)
	}

	return apperr.ErrBadRequest
}

// validationError maps the first failed rule to a translated message.
func validationError(fe validator.FieldError) error {
	data := map[string]any{"Field": fe.Field(), "Param": fe.Param()}

	id := "validation.invalid"
	switch fe.Tag() {
	case "required", "email", "gt", "gte", "lt", "lte":
		id = "validation." + fe.Tag()
	case "min", "max":
		switch fe.Kind() {
		case reflect.String:
			id = "validation." + fe.Tag() + "_string"
		case reflect.Slice, reflect.Array, reflect.Map:
			id = "validation." + fe.Tag() + "_slice"
		default:
			id = "validation." + fe.Tag()
		}
	}

	return apperr.ErrBadRequest.WithMessage(id, data)
}

// GetLanguage returns the raw Accept-Language header, or the default
// language when it is missing.
func GetLanguage(ctx *gin.Context) string {
	if lang := ctx.GetHeader(constantvar.HEADER_ACCEPT_LANGUAGE); lang != "" {
		return lang
	}

	return i18n.DEFAULT_LANGUAGE.String()
}
