package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"sync"
	"syscall"

	"github.com/sighthog/workers/internal/config"
	"github.com/sighthog/workers/internal/consumer"
	"github.com/sighthog/workers/internal/db"
	"github.com/sighthog/workers/internal/writer"
)

func main() {
	cfg := config.Load()
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	pgPool, err := db.NewPostgresPool(ctx, cfg)
	if err != nil {
		logger.Error("postgres init failed", "error", err)
		os.Exit(1)
	}
	defer pgPool.Close()

	chConn, err := db.NewClickHouseConn(ctx, cfg)
	if err != nil {
		logger.Error("clickhouse init failed", "error", err)
		os.Exit(1)
	}
	defer chConn.Close()

	s3Client, err := db.NewS3Client(ctx, cfg)
	if err != nil {
		logger.Error("s3 init failed", "error", err)
		os.Exit(1)
	}

	pgWriter := writer.NewPostgresWriter(pgPool)
	chWriter := writer.NewClickHouseWriter(chConn)
	metricsPipeline := consumer.NewMetricsPipeline(cfg, chWriter)
	blobWriter := writer.NewBlobWriter(s3Client, cfg)

	var wg sync.WaitGroup
	errCh := make(chan error, 3)

	startWorker := func(name string, fn func(context.Context) error) {
		wg.Add(1)
		go func() {
			defer wg.Done()
			if err := fn(ctx); err != nil {
				logger.Error("worker stopped with error", "worker", name, "error", err)
				errCh <- err
				stop()
			}
		}()
	}

	logger.Info("starting all worker loops")
	blobWriter.Start()

	startWorker("metadata", func(ctx context.Context) error {
		return consumer.RunMetadata(ctx, cfg, pgWriter, logger)
	})
	startWorker("metrics", func(ctx context.Context) error {
		return consumer.RunMetrics(ctx, cfg, metricsPipeline, logger)
	})
	startWorker("blob", func(ctx context.Context) error {
		return consumer.RunBlob(ctx, cfg, blobWriter, logger)
	})

	<-ctx.Done()
	logger.Info("shutdown signal received, flushing batches")

	metricsPipeline.Stop()
	blobWriter.Stop()

	wg.Wait()
	logger.Info("all workers stopped")
}
