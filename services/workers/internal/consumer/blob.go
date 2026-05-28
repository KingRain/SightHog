package consumer

import (
	"context"
	"log/slog"

	"github.com/sighthog/workers/internal/config"
	"github.com/sighthog/workers/internal/models"
	"github.com/sighthog/workers/internal/writer"
)

const blobGroupID = "sh-blob-worker"

func RunBlob(ctx context.Context, cfg config.Config, blobWriter *writer.BlobWriter, logger *slog.Logger) error {
	reader := NewReader(cfg.KafkaBrokers, cfg.KafkaTopic, blobGroupID, logger, func(_ context.Context, payload models.EnrichedPayload) error {
		blobWriter.Append(payload.SessionID, payload.Events)
		return nil
	})
	defer reader.Close()

	logger.Info("blob worker started", "group", blobGroupID)
	return reader.Run(ctx)
}
