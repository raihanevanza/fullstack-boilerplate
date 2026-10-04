package middleware_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/raihanevanza/fullstack-boilerplate/backend/api/middleware"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/constantvar"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/model/response"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/token"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const secret = "0123456789abcdef0123456789abcdef"

func TestAuthAndRequire(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tokens := token.NewManager(secret, time.Hour, "test")
	otherIssuer := token.NewManager(secret, time.Hour, "other")
	otherSecret := token.NewManager("ffffffffffffffffffffffffffffffff", time.Hour, "test")
	expired := token.NewManager(secret, -time.Minute, "test")

	router := gin.New()
	router.POST("/products", middleware.Auth(tokens), middleware.Require(constantvar.PERM_PRODUCT_WRITE), func(ctx *gin.Context) {
		ctx.String(http.StatusOK, middleware.GetActor(ctx).FullName)
	})

	bearer := func(m token.Manager, role string) string {
		s, _, err := m.Issue(1, "Ada", role)
		require.NoError(t, err)
		return "Bearer " + s
	}
	noneAlg, _ := jwt.NewWithClaims(jwt.SigningMethodNone, jwt.MapClaims{"sub": "1", "role": "ADMIN", "iss": "test", "exp": time.Now().Add(time.Hour).Unix()}).
		SignedString(jwt.UnsafeAllowNoneSignatureType)

	tests := []struct {
		name     string
		header   string
		want     int
		wantCode string
	}{
		{"no header", "", http.StatusUnauthorized, "err_unauthorized"},
		{"not a bearer token", "Basic YWRtaW46YWRtaW4=", http.StatusUnauthorized, "err_unauthorized"},
		{"empty bearer", "Bearer ", http.StatusUnauthorized, "err_unauthorized"},
		{"garbage token", "Bearer abc.def.ghi", http.StatusUnauthorized, "err_unauthorized"},
		{"alg none", "Bearer " + noneAlg, http.StatusUnauthorized, "err_unauthorized"},
		{"other issuer", bearer(otherIssuer, constantvar.ROLE_ADMIN), http.StatusUnauthorized, "err_unauthorized"},
		{"other secret", bearer(otherSecret, constantvar.ROLE_ADMIN), http.StatusUnauthorized, "err_unauthorized"},
		{"expired", bearer(expired, constantvar.ROLE_ADMIN), http.StatusUnauthorized, "err_unauthorized"},
		{"staff lacks product.write", bearer(tokens, constantvar.ROLE_STAFF), http.StatusForbidden, "err_forbidden"},
		{"unknown role", bearer(tokens, "GUEST"), http.StatusForbidden, "err_forbidden"},
		{"admin allowed", bearer(tokens, constantvar.ROLE_ADMIN), http.StatusOK, ""},
		{"scheme is case-insensitive", "bearer " + bearer(tokens, constantvar.ROLE_ADMIN)[7:], http.StatusOK, ""},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			recorder := httptest.NewRecorder()
			req := httptest.NewRequest(http.MethodPost, "/products", nil)
			if test.header != "" {
				req.Header.Set("Authorization", test.header)
			}

			router.ServeHTTP(recorder, req)

			assert.Equal(t, test.want, recorder.Code, recorder.Body.String())
			if test.want == http.StatusOK {
				assert.Equal(t, "Ada", recorder.Body.String())
				return
			}

			var resp response.Response
			require.NoError(t, json.Unmarshal(recorder.Body.Bytes(), &resp))
			require.NotNil(t, resp.Error)
			assert.Equal(t, test.wantCode, resp.Error.ErrorCode)
			assert.Nil(t, resp.Data)
		})
	}
}
