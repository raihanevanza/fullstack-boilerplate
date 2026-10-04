package utils

import (
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestLoadConfig(t *testing.T) {
	dir := t.TempDir()
	envFile := filepath.Join(dir, ".env")
	require.NoError(t, os.WriteFile(envFile, []byte(
		"PORT=9000\nSTAGE=PRODUCTION\nSQL_SERVER_URI=sqlserver://sa:x@localhost:1433?database=AppDb\n"+
			"JWT_SECRET=0123456789abcdef0123456789abcdef\nCORS_ALLOW_ORIGINS= http://a.test , ,http://b.test\n"), 0o600))

	t.Run("file values and defaults", func(t *testing.T) {
		conf, err := LoadConfig(envFile)
		require.NoError(t, err)
		assert.Equal(t, "9000", conf.PORT)
		assert.True(t, conf.IsProduction())
		assert.Equal(t, "boilerplate-backend", conf.ServiceName)
		assert.Equal(t, 8*time.Hour, conf.JwtTTL())
		assert.Equal(t, []string{"http://a.test", "http://b.test"}, conf.CorsOrigins())
		assert.Empty(t, conf.TrustedProxyList())
	})

	t.Run("environment overrides file", func(t *testing.T) {
		t.Setenv("PORT", "9100")
		t.Setenv("JWT_TTL", "30m")
		conf, err := LoadConfig(envFile)
		require.NoError(t, err)
		assert.Equal(t, "9100", conf.PORT)
		assert.Equal(t, 30*time.Minute, conf.JwtTTL())
	})

	t.Run("short secret is rejected", func(t *testing.T) {
		t.Setenv("JWT_SECRET", "too-short")
		_, err := LoadConfig(envFile)
		assert.ErrorContains(t, err, "Secret")
	})
}
