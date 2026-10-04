package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os/signal"
	"syscall"
	"time"

	"github.com/raihanevanza/fullstack-boilerplate/backend/api/middleware"
	"github.com/raihanevanza/fullstack-boilerplate/backend/api/registry"
	"github.com/raihanevanza/fullstack-boilerplate/backend/api/route"
	_ "github.com/raihanevanza/fullstack-boilerplate/backend/docs"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/datasource"
	"github.com/raihanevanza/fullstack-boilerplate/backend/pkg/logger"
	"github.com/raihanevanza/fullstack-boilerplate/backend/utils"

	"go.uber.org/zap"
)

//	@title			Fullstack Boilerplate API
//	@version		1.0
//	@description	Example REST API: JWT auth, role permissions, dashboard and product CRUD. Envelope: {error, message, data}.
//	@host			localhost:8080
//	@BasePath		/
//	@schemes		http https

//	@securityDefinitions.apikey	BearerAuth
//	@in							header
//	@name						Authorization
//	@description				Value: "Bearer {access_token}". Get the token from POST /api/auth/login.

func main() {
	if err := utils.Init(); err != nil {
		log.Fatalf("init: %v", err)
	}
	defer logger.Sync()
	conf := utils.GetConfig()

	ds, err := datasource.New(datasource.Options{DSN: conf.SqlServer.URI, Verbose: conf.IsDevelopment()})
	if err != nil {
		logger.Error("open database", zap.Error(err))
		log.Fatalf("open database: %v", err)
	}
	defer ds.Close()

	reg := registry.NewRegistry(ds, conf)
	router, err := route.NewServer(route.Options{
		Options: middleware.Options{
			AllowOrigins:   conf.CorsOrigins(),
			AllowLocalhost: conf.IsDevelopment(),
		},
		Production:     conf.IsProduction(),
		TrustedProxies: conf.TrustedProxyList(),
	}, reg.NewController(), reg.TokenManager())
	if err != nil {
		log.Fatalf("build router: %v", err)
	}

	server := &http.Server{
		Addr:              ":" + conf.PORT,
		Handler:           router,
		ReadHeaderTimeout: 10 * time.Second,
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	go func() {
		logger.Info("server started", zap.String("addr", server.Addr), zap.String("stage", conf.STAGE))
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Error("server stopped", zap.Error(err))
			stop()
		}
	}()

	<-ctx.Done()
	logger.Info("shutting down")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		logger.Error("graceful shutdown", zap.Error(err))
	}
}
