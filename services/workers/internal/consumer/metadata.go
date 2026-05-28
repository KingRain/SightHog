package consumer

import (
	"context"
	"log/slog"

	"github.com/sighthog/workers/internal/config"
	"github.com/sighthog/workers/internal/models"
	"github.com/sighthog/workers/internal/writer"
)

const metadataGroupID = "sh-metadata-worker"

func RunMetadata(ctx context.Context, cfg config.Config, pgWriter *writer.PostgresWriter, logger *slog.Logger) error {
	reader := NewReader(cfg.KafkaBrokers, cfg.KafkaTopic, metadataGroupID, logger, func(ctx context.Context, payload models.EnrichedPayload) error {
		return pgWriter.UpsertSession(ctx, payload)
	})
	defer reader.Close()

	logger.Info("metadata worker started", "group", metadataGroupID)
	return reader.Run(ctx)
}
