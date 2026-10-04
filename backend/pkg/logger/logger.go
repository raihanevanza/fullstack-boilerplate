// Package logger is a thin wrapper around zap that writes structured JSON
// (Elastic Common Schema field names) to stdout.
//
// Until Init is called every call is a no-op, which keeps unit tests quiet.
//
//	logger.Init(logger.Config{ServiceName: "api", Stage: "DEVELOPMENT"})
//	logger.Error("create product", zap.Error(err), zap.Int64("product_id", id))
package logger

import (
	"io"
	"os"
	"sync/atomic"

	"go.elastic.co/ecszap"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

type Config struct {
	ServiceName string
	// Stage is the STAGE env var. DEVELOPMENT logs at debug level,
	// every other stage at info level.
	Stage string
	// Output defaults to os.Stdout.
	Output io.Writer
}

var current atomic.Pointer[zap.Logger]

func init() {
	current.Store(zap.NewNop())
}

// Init replaces the global logger.
func Init(cfg Config) error {
	out := cfg.Output
	if out == nil {
		out = os.Stdout
	}

	level := zapcore.InfoLevel
	if cfg.Stage == "DEVELOPMENT" {
		level = zapcore.DebugLevel
	}

	core := ecszap.NewCore(ecszap.NewDefaultEncoderConfig(), zapcore.AddSync(out), level)
	l := zap.New(core, zap.AddCaller(), zap.AddCallerSkip(1), zap.AddStacktrace(zapcore.ErrorLevel)).
		With(zap.String("service.name", cfg.ServiceName), zap.String("service.environment", cfg.Stage))

	current.Store(l)
	return nil
}

// L returns the underlying *zap.Logger for advanced use (e.g. With fields).
func L() *zap.Logger { return current.Load() }

// Sync flushes buffered entries. Call it before the process exits.
func Sync() { _ = current.Load().Sync() }

func Debug(msg string, fields ...zap.Field) { current.Load().Debug(msg, fields...) }
func Info(msg string, fields ...zap.Field)  { current.Load().Info(msg, fields...) }
func Warn(msg string, fields ...zap.Field)  { current.Load().Warn(msg, fields...) }
func Error(msg string, fields ...zap.Field) { current.Load().Error(msg, fields...) }
