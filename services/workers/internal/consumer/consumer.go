package consumer

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"

	"github.com/segmentio/kafka-go"
	"github.com/sighthog/workers/internal/models"
)

type Handler func(ctx context.Context, payload models.EnrichedPayload) error

type Reader struct {
	reader  *kafka.Reader
	logger  *slog.Logger
	handler Handler
}

func NewReader(brokers, topic, groupID string, logger *slog.Logger, handler Handler) *Reader {
	return &Reader{
		reader: kafka.NewReader(kafka.ReaderConfig{
			Brokers:  []string{brokers},
			GroupID:  groupID,
			Topic:    topic,
			MinBytes: 1,
			MaxBytes: 10e6,
		}),
		logger:  logger,
		handler: handler,
	}
}

func (r *Reader) Run(ctx context.Context) error {
	for {
		msg, err := r.reader.FetchMessage(ctx)
		if err != nil {
			if ctx.Err() != nil {
				return nil
			}
			return fmt.Errorf("fetch message: %w", err)
		}

		var payload models.EnrichedPayload
		if err := json.Unmarshal(msg.Value, &payload); err != nil {
			r.logger.Warn("skipping malformed payload", "error", err)
			if err := r.reader.CommitMessages(ctx, msg); err != nil {
				return fmt.Errorf("commit malformed message: %w", err)
			}
			continue
		}

		if err := r.handler(ctx, payload); err != nil {
			return fmt.Errorf("handle message: %w", err)
		}

		if err := r.reader.CommitMessages(ctx, msg); err != nil {
			return fmt.Errorf("commit message: %w", err)
		}
	}
}

func (r *Reader) Close() error {
	return r.reader.Close()
}
