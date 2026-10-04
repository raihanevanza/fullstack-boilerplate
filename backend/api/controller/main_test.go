package controller_test

import (
	"encoding/json"
	"io"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/raihanevanza/fullstack-boilerplate/backend/api/controller"
	"github.com/raihanevanza/fullstack-boilerplate/backend/api/route"
	mock_usecase "github.com/raihanevanza/fullstack-boilerplate/backend/mock/usecase"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/model/response"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/token"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
	"go.uber.org/mock/gomock"
)

// testServer is the real router (middleware, auth, permissions and routes)
// backed by mocked use cases.
type testServer struct {
	router    *gin.Engine
	tokens    token.Manager
	common    *mock_usecase.MockCommonUsecase
	auth      *mock_usecase.MockAuthUsecase
	dashboard *mock_usecase.MockDashboardUsecase
	product   *mock_usecase.MockProductUsecase
}

func newTestServer(t *testing.T) *testServer {
	gin.SetMode(gin.TestMode)
	ctrl := gomock.NewController(t)

	s := &testServer{
		tokens:    token.NewManager("0123456789abcdef0123456789abcdef", time.Hour, "test"),
		common:    mock_usecase.NewMockCommonUsecase(ctrl),
		auth:      mock_usecase.NewMockAuthUsecase(ctrl),
		dashboard: mock_usecase.NewMockDashboardUsecase(ctrl),
		product:   mock_usecase.NewMockProductUsecase(ctrl),
	}

	router, err := route.NewServer(route.Options{Production: true}, controller.Controller{
		CommonController:    controller.NewCommonController(s.common),
		AuthController:      controller.NewAuthController(s.auth),
		DashboardController: controller.NewDashboardController(s.dashboard),
		ProductController:   controller.NewProductController(s.product),
	}, s.tokens)
	require.NoError(t, err)
	s.router = router

	return s
}

func (s *testServer) bearer(t *testing.T, role string) string {
	tok, _, err := s.tokens.Issue(1, "Test User", role)
	require.NoError(t, err)
	return "Bearer " + tok
}

type call struct {
	method string
	path   string
	body   string
	auth   string
	lang   string
}

func (s *testServer) do(t *testing.T, c call) (int, response.Response) {
	var body io.Reader
	if c.body != "" {
		body = strings.NewReader(c.body)
	}

	req := httptest.NewRequest(c.method, c.path, body)
	req.Header.Set("Content-Type", "application/json")
	if c.auth != "" {
		req.Header.Set("Authorization", c.auth)
	}
	if c.lang != "" {
		req.Header.Set("Accept-Language", c.lang)
	}

	recorder := httptest.NewRecorder()
	s.router.ServeHTTP(recorder, req)

	var resp response.Response
	require.NoError(t, json.Unmarshal(recorder.Body.Bytes(), &resp), recorder.Body.String())

	return recorder.Code, resp
}
