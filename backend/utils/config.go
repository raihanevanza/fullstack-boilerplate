package utils

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"reflect"
	"runtime"
	"strings"
	"time"

	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/constantvar"

	"github.com/go-playground/validator/v10"
	"github.com/spf13/viper"
)

type (
	// Config is loaded from a .env file (when present) and overridden by
	// real environment variables, so the same binary works locally and in
	// containers (docker run --env-file ...).
	Config struct {
		PORT        string `mapstructure:"PORT" validate:"required,numeric"`
		STAGE       string `mapstructure:"STAGE" validate:"required,oneof=DEVELOPMENT STAGING PRODUCTION"`
		ServiceName string `mapstructure:"SERVICE_NAME" validate:"required"`

		// Comma separated, e.g. "http://localhost:5173,https://app.example.com".
		// Empty allows every origin.
		CorsAllowOrigins string `mapstructure:"CORS_ALLOW_ORIGINS"`
		// Comma separated proxy IPs/CIDRs whose X-Forwarded-For is trusted.
		// Empty trusts none (the client IP is the TCP peer).
		TrustedProxies string `mapstructure:"TRUSTED_PROXIES"`

		SqlServer SqlServer `mapstructure:",squash"`
		Jwt       Jwt       `mapstructure:",squash"`
	}

	SqlServer struct {
		// sqlserver://user:password@host:1433?database=AppDb&encrypt=disable
		URI string `mapstructure:"SQL_SERVER_URI" validate:"required,startswith=sqlserver://"`
	}

	Jwt struct {
		Secret string `mapstructure:"JWT_SECRET" validate:"required,min=32"`
		// Access token lifetime as a Go duration, e.g. "8h".
		TTL string `mapstructure:"JWT_TTL"`
	}
)

var configDefaults = map[string]any{
	"PORT":         "8080",
	"STAGE":        constantvar.CONFIG_STAGE_DEV,
	"SERVICE_NAME": "boilerplate-backend",
	"JWT_TTL":      "8h",
}

// LoadConfig reads configuration. envFile may be empty: then ENV_FILE, ./.env
// and <module root>/.env are tried in that order. A missing file is not an
// error, only missing or invalid values are.
func LoadConfig(envFile string) (*Config, error) {
	v := viper.New()
	v.AutomaticEnv()

	for key, value := range configDefaults {
		v.SetDefault(key, value)
	}
	// AutomaticEnv only applies to keys viper already knows about, so bind
	// every key declared in Config explicitly.
	for _, key := range configKeys(reflect.TypeOf(Config{})) {
		if err := v.BindEnv(key); err != nil {
			return nil, err
		}
	}

	if path := findEnvFile(envFile); path != "" {
		v.SetConfigFile(path)
		v.SetConfigType("env")
		if err := v.ReadInConfig(); err != nil {
			return nil, fmt.Errorf("read %s: %w", path, err)
		}
	}

	var conf Config
	if err := v.Unmarshal(&conf); err != nil {
		return nil, err
	}

	if err := validator.New().Struct(&conf); err != nil {
		var ve validator.ValidationErrors
		if errors.As(err, &ve) && len(ve) > 0 {
			return nil, fmt.Errorf("invalid config: %s failed on %q", ve[0].Field(), ve[0].Tag())
		}

		return nil, err
	}

	return &conf, nil
}

func configKeys(t reflect.Type) []string {
	var keys []string
	for i := 0; i < t.NumField(); i++ {
		field := t.Field(i)
		tag := field.Tag.Get("mapstructure")
		if field.Type.Kind() == reflect.Struct && strings.Contains(tag, "squash") {
			keys = append(keys, configKeys(field.Type)...)
			continue
		}
		if tag != "" && tag != "-" {
			keys = append(keys, tag)
		}
	}

	return keys
}

func findEnvFile(explicit string) string {
	candidates := []string{explicit, os.Getenv("ENV_FILE"), ".env", filepath.Join(RootDir(), ".env")}
	for _, path := range candidates {
		if path == "" {
			continue
		}
		if info, err := os.Stat(path); err == nil && !info.IsDir() {
			return path
		}
	}

	return ""
}

// RootDir returns the backend module root (based on this file's location at
// build time). Useful during development and tests.
func RootDir() string {
	_, file, _, _ := runtime.Caller(0)
	return filepath.Dir(filepath.Dir(file))
}

func (conf *Config) JwtTTL() time.Duration {
	if ttl, err := time.ParseDuration(conf.Jwt.TTL); err == nil && ttl > 0 {
		return ttl
	}

	return 8 * time.Hour
}

func (conf *Config) CorsOrigins() []string { return splitList(conf.CorsAllowOrigins) }

func (conf *Config) TrustedProxyList() []string { return splitList(conf.TrustedProxies) }

func (conf *Config) IsDevelopment() bool { return conf.STAGE == constantvar.CONFIG_STAGE_DEV }

func (conf *Config) IsProduction() bool { return conf.STAGE == constantvar.CONFIG_STAGE_PROD }

func splitList(s string) []string {
	var items []string
	for _, item := range strings.Split(s, ",") {
		if item = strings.TrimSpace(item); item != "" {
			items = append(items, item)
		}
	}

	return items
}
