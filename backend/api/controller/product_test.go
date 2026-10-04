package controller_test

import (
	"net/http"
	"testing"

	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/apperr"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/constantvar"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/model/request"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/model/response"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/mock/gomock"
)

const validProduct = `{"sku":" PRD-0100 ","name":"Webcam","description":"  ","price":0,"stock":5}`

func TestProductController(t *testing.T) {
	tests := []struct {
		name       string
		call       func(s *testServer) call
		mock       func(s *testServer)
		wantStatus int
		wantCode   string
		wantMsg    string
	}{
		{
			name: "create without token is 401",
			call: func(s *testServer) call {
				return call{method: http.MethodPost, path: "/api/products", body: validProduct}
			},
			wantStatus: http.StatusUnauthorized, wantCode: "err_unauthorized",
		},
		{
			name: "staff cannot create (403)",
			call: func(s *testServer) call {
				return call{method: http.MethodPost, path: "/api/products", body: validProduct, auth: s.bearer(t, constantvar.ROLE_STAFF)}
			},
			wantStatus: http.StatusForbidden, wantCode: "err_forbidden", wantMsg: "You do not have permission to perform this action.",
		},
		{
			name: "staff cannot update or delete (403)",
			call: func(s *testServer) call {
				return call{method: http.MethodDelete, path: "/api/products/1", auth: s.bearer(t, constantvar.ROLE_STAFF), lang: "id"}
			},
			wantStatus: http.StatusForbidden, wantCode: "err_forbidden", wantMsg: "Anda tidak memiliki izin untuk melakukan aksi ini.",
		},
		{
			name: "admin creates (201) with normalized input",
			call: func(s *testServer) call {
				return call{method: http.MethodPost, path: "/api/products", body: validProduct, auth: s.bearer(t, constantvar.ROLE_ADMIN)}
			},
			mock: func(s *testServer) {
				s.product.EXPECT().Create(gomock.Any(), gomock.Any(), gomock.Any()).
					DoAndReturn(func(_ any, actor request.Actor, req request.ProductRequest) (*response.ProductResponse, error) {
						assert.Equal(t, int64(1), actor.UserID)
						assert.Equal(t, "PRD-0100", req.Sku)
						assert.Nil(t, req.Description)
						assert.Equal(t, 0.0, *req.Price)
						return &response.ProductResponse{ID: 10, Sku: req.Sku, IsActive: true}, nil
					})
			},
			wantStatus: http.StatusCreated,
		},
		{
			name: "missing price is 400",
			call: func(s *testServer) call {
				return call{method: http.MethodPost, path: "/api/products", body: `{"sku":"A","name":"B","stock":1}`, auth: s.bearer(t, constantvar.ROLE_ADMIN)}
			},
			wantStatus: http.StatusBadRequest, wantCode: "bad_request", wantMsg: "price is required.",
		},
		{
			name: "negative stock is 400 (Indonesian)",
			call: func(s *testServer) call {
				return call{method: http.MethodPost, path: "/api/products", body: `{"sku":"A","name":"B","price":1,"stock":-1}`, auth: s.bearer(t, constantvar.ROLE_ADMIN), lang: "id-ID,id;q=0.9"}
			},
			wantStatus: http.StatusBadRequest, wantCode: "bad_request", wantMsg: "stock harus lebih besar dari atau sama dengan 0.",
		},
		{
			name: "blank sku is 400",
			call: func(s *testServer) call {
				return call{method: http.MethodPost, path: "/api/products", body: `{"sku":"   ","name":"B","price":1,"stock":1}`, auth: s.bearer(t, constantvar.ROLE_ADMIN)}
			},
			wantStatus: http.StatusBadRequest, wantCode: "bad_request", wantMsg: "sku is required.",
		},
		{
			name: "fractional stock is 400",
			call: func(s *testServer) call {
				return call{method: http.MethodPost, path: "/api/products", body: `{"sku":"A","name":"B","price":1,"stock":1.5}`, auth: s.bearer(t, constantvar.ROLE_ADMIN)}
			},
			wantStatus: http.StatusBadRequest, wantCode: "bad_request", wantMsg: "stock has the wrong type.",
		},
		{
			name: "malformed JSON is 400",
			call: func(s *testServer) call {
				return call{method: http.MethodPost, path: "/api/products", body: `{"sku":`, auth: s.bearer(t, constantvar.ROLE_ADMIN)}
			},
			wantStatus: http.StatusBadRequest, wantCode: "bad_request", wantMsg: "The request body is not valid JSON.",
		},
		{
			name: "duplicate SKU is 409",
			call: func(s *testServer) call {
				return call{method: http.MethodPost, path: "/api/products", body: validProduct, auth: s.bearer(t, constantvar.ROLE_ADMIN)}
			},
			mock: func(s *testServer) {
				s.product.EXPECT().Create(gomock.Any(), gomock.Any(), gomock.Any()).
					Return(nil, apperr.ErrDuplicate.WithMessage("msg.duplicate_sku", map[string]any{"Sku": "PRD-0100"}))
			},
			wantStatus: http.StatusConflict, wantCode: "err_duplicate", wantMsg: "SKU PRD-0100 is already used by another product.",
		},
		{
			name: "list applies query parameters",
			call: func(s *testServer) call {
				return call{method: http.MethodGet, path: "/api/products?page=2&limit=5&search=mouse&active_only=true", auth: s.bearer(t, constantvar.ROLE_STAFF)}
			},
			mock: func(s *testServer) {
				s.product.EXPECT().List(gomock.Any(), request.ProductListQuery{
					PaginationQuery: request.PaginationQuery{Page: 2, Limit: 5, Search: "mouse"}, ActiveOnly: true,
				}).Return(&response.PaginatedData[response.ProductResponse]{Data: []response.ProductResponse{}}, nil)
			},
			wantStatus: http.StatusOK,
		},
		{
			name: "limit above 100 is 400",
			call: func(s *testServer) call {
				return call{method: http.MethodGet, path: "/api/products?limit=101", auth: s.bearer(t, constantvar.ROLE_STAFF)}
			},
			wantStatus: http.StatusBadRequest, wantCode: "bad_request", wantMsg: "limit must be at most 100.",
		},
		{
			name: "invalid id is 400",
			call: func(s *testServer) call {
				return call{method: http.MethodGet, path: "/api/products/abc", auth: s.bearer(t, constantvar.ROLE_STAFF)}
			},
			wantStatus: http.StatusBadRequest, wantCode: "bad_request",
		},
		{
			name: "get missing product is 404",
			call: func(s *testServer) call {
				return call{method: http.MethodGet, path: "/api/products/99", auth: s.bearer(t, constantvar.ROLE_STAFF)}
			},
			mock: func(s *testServer) {
				s.product.EXPECT().Get(gomock.Any(), int64(99)).Return(nil, apperr.ErrNotFound)
			},
			wantStatus: http.StatusNotFound, wantCode: "err_not_found", wantMsg: "The data you are looking for does not exist.",
		},
		{
			name: "unexpected error is a generic 500",
			call: func(s *testServer) call {
				return call{method: http.MethodGet, path: "/api/products/1", auth: s.bearer(t, constantvar.ROLE_STAFF)}
			},
			mock: func(s *testServer) {
				s.product.EXPECT().Get(gomock.Any(), int64(1)).Return(nil, assert.AnError)
			},
			wantStatus: http.StatusInternalServerError, wantCode: "internal_server_error",
		},
		{
			name: "admin deletes, data is null",
			call: func(s *testServer) call {
				return call{method: http.MethodDelete, path: "/api/products/3", auth: s.bearer(t, constantvar.ROLE_ADMIN)}
			},
			mock: func(s *testServer) {
				s.product.EXPECT().Delete(gomock.Any(), gomock.Any(), int64(3)).Return(nil)
			},
			wantStatus: http.StatusOK,
		},
		{
			name: "unknown route uses the envelope",
			call: func(s *testServer) call {
				return call{method: http.MethodGet, path: "/api/nope", auth: s.bearer(t, constantvar.ROLE_ADMIN)}
			},
			wantStatus: http.StatusNotFound, wantCode: "err_not_found", wantMsg: "Route GET /api/nope does not exist.",
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			s := newTestServer(t)
			if test.mock != nil {
				test.mock(s)
			}

			status, resp := s.do(t, test.call(s))
			assert.Equal(t, test.wantStatus, status)

			if test.wantCode == "" {
				assert.Nil(t, resp.Error)
				require.NotNil(t, resp.Message)
				assert.Equal(t, "success", *resp.Message)
				return
			}

			require.NotNil(t, resp.Error)
			assert.Nil(t, resp.Message)
			assert.Nil(t, resp.Data)
			assert.Equal(t, test.wantCode, resp.Error.ErrorCode)
			assert.NotEmpty(t, resp.Error.Title)
			if test.wantMsg != "" {
				assert.Equal(t, test.wantMsg, resp.Error.Message)
			}
		})
	}
}
