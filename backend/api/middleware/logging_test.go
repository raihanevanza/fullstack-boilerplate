package middleware

import (
	"encoding/json"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestLoggableBodyRedactsSecrets(t *testing.T) {
	login := loggableBody([]byte(`{"email":"a@b.c","password":"Password123!"}`), []string{"password"})
	assert.Equal(t, map[string]any{"email": "a@b.c", "password": redactedValue}, login)

	nested := loggableBody([]byte(`{"data":{"access_token":"eyJ.secret","user":{"id":1}}}`), []string{"access_token"})
	out, err := json.Marshal(nested)
	require.NoError(t, err)
	assert.NotContains(t, string(out), "eyJ.secret")
	assert.Contains(t, string(out), `"user":{"id":1}`)

	big := loggableBody([]byte(`{"password":"secret","pad":"`+strings.Repeat("x", maxLoggedBody)+`"}`), []string{"password"})
	assert.IsType(t, "", big)
	assert.NotContains(t, big, "secret")
	assert.True(t, strings.HasSuffix(big.(string), "...(truncated)"))

	assert.Equal(t, "not json", loggableBody([]byte("not json"), nil))
	assert.Nil(t, loggableBody(nil, nil))
}
