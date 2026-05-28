package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sighthog/ingest-api/internal/config"
	"github.com/sighthog/ingest-api/internal/geoip"
	"github.com/sighthog/ingest-api/internal/handler"
	"github.com/sighthog/ingest-api/internal/kafka"
	"github.com/sighthog/ingest-api/internal/middleware"
)

func main() {
	cfg := config.Load()
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))

	producer := kafka.NewProducer(cfg.KafkaBrokers, cfg.KafkaTopic)
	defer producer.Close()

	geoResolver := geoip.NewResolver(cfg.GeoLite2DBPath, logger)
	defer geoResolver.Close()

	gin.SetMode(gin.ReleaseMode)
	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(middleware.CORS(cfg.CORSAllowOrigins))
	router.Use(middleware.RequestID())

	eventsHandler := handler.NewEventsHandler(producer, geoResolver, logger)
	router.GET("/healthz", eventsHandler.Healthz)
	router.POST("/v1/events", gin.HandlerFunc(func(c *gin.Context) {
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, cfg.MaxBodyBytes)
		eventsHandler.IngestEvents(c)
	}))

	server := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           router,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      10 * time.Second,
		MaxHeaderBytes:    1 << 20,
	}

	go func() {
		logger.Info("ingest api starting", "port", cfg.Port, "kafkaBrokers", cfg.KafkaBrokers, "topic", cfg.KafkaTopic)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error("server failed", "error", err)
			os.Exit(1)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		logger.Error("server shutdown failed", "error", err)
	}
	logger.Info("ingest api stopped")
}
