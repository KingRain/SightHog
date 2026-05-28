package consumer

import (
	"context"
	"encoding/json"
	"log/slog"
	"math"

	"github.com/sighthog/workers/internal/config"
	"github.com/sighthog/workers/internal/models"
	"github.com/sighthog/workers/internal/writer"
)

const metricsGroupID = "sh-metrics-worker"

type MetricsPipeline struct {
	chWriter            *writer.ClickHouseWriter
	eventsBatcher       *writer.Batcher[writer.EventRow]
	interactionsBatcher *writer.Batcher[writer.InteractionRow]
	telemetryBatcher    *writer.Batcher[writer.TelemetryLogRow]
}

func NewMetricsPipeline(cfg config.Config, chWriter *writer.ClickHouseWriter) *MetricsPipeline {
	p := &MetricsPipeline{chWriter: chWriter}

	p.eventsBatcher = writer.NewBatcher(cfg.ClickHouseBatchSize, cfg.ClickHouseBatchInterval, func(rows []writer.EventRow) error {
		return chWriter.FlushEvents(context.Background(), rows)
	})
	p.interactionsBatcher = writer.NewBatcher(cfg.ClickHouseBatchSize, cfg.ClickHouseBatchInterval, func(rows []writer.InteractionRow) error {
		return chWriter.FlushInteractions(context.Background(), rows)
	})
	p.telemetryBatcher = writer.NewBatcher(cfg.ClickHouseBatchSize, cfg.ClickHouseBatchInterval, func(rows []writer.TelemetryLogRow) error {
		return chWriter.FlushTelemetryLogs(context.Background(), rows)
	})

	p.eventsBatcher.Start()
	p.interactionsBatcher.Start()
	p.telemetryBatcher.Start()
	return p
}

func (p *MetricsPipeline) Stop() {
	p.eventsBatcher.Stop()
	p.interactionsBatcher.Stop()
	p.telemetryBatcher.Stop()
}

func eventRowFromPayload(payload models.EnrichedPayload, eventName string, metricValue float64, ts int64) writer.EventRow {
	country := payload.Country
	if country == "" {
		country = "Unknown"
	}
	browser := payload.Browser
	if browser == "" {
		browser = "Unknown"
	}
	osName := payload.OS
	if osName == "" {
		osName = "Unknown"
	}

	return writer.EventRow{
		SessionID:   payload.SessionID,
		UserID:      payload.UserID,
		URL:         payload.URL,
		EventName:   eventName,
		MetricValue: metricValue,
		Country:     country,
		VisitorID:   payload.VisitorID,
		Browser:     browser,
		OS:          osName,
		Referrer:    payload.Referrer,
		Timestamp:   writer.MsToTime(ts),
	}
}

func (p *MetricsPipeline) Handle(_ context.Context, payload models.EnrichedPayload) error {
	ts := payload.Timestamp

	if err := p.eventsBatcher.Add(eventRowFromPayload(payload, "pageview", 1, ts)); err != nil {
		return err
	}

	for _, interaction := range payload.Interactions {
		if err := p.interactionsBatcher.Add(writer.InteractionRow{
			SessionID: payload.SessionID,
			URL:       payload.URL,
			Type:      interaction.Type,
			X:         clampUint16(interaction.X),
			Y:         clampUint16(interaction.Y),
			Target:    interaction.Target,
			Timestamp: writer.MsToTime(interaction.Timestamp),
		}); err != nil {
			return err
		}

		eventName := interaction.Type
		if eventName == "" {
			continue
		}

		if err := p.eventsBatcher.Add(eventRowFromPayload(payload, eventName, 1, interaction.Timestamp)); err != nil {
			return err
		}
	}

	for _, entry := range payload.Telemetry {
		metadataJSON := "{}"
		if entry.Metadata != nil {
			encoded, err := json.Marshal(entry.Metadata)
			if err == nil {
				metadataJSON = string(encoded)
			}
		}

		logTimestamp := entry.Timestamp
		if logTimestamp <= 0 {
			logTimestamp = payload.Timestamp
		}

		if err := p.telemetryBatcher.Add(writer.TelemetryLogRow{
			SessionID: payload.SessionID,
			Type:      entry.Type,
			SubType:   entry.SubType,
			Message:   entry.Message,
			Metadata:  metadataJSON,
			Timestamp: writer.MsToTime(logTimestamp),
		}); err != nil {
			return err
		}
	}

	return nil
}

func clampUint16(v float64) uint16 {
	if v < 0 {
		return 0
	}
	if v > math.MaxUint16 {
		return math.MaxUint16
	}
	return uint16(v)
}

func RunMetrics(ctx context.Context, cfg config.Config, pipeline *MetricsPipeline, logger *slog.Logger) error {
	reader := NewReader(cfg.KafkaBrokers, cfg.KafkaTopic, metricsGroupID, logger, pipeline.Handle)
	defer reader.Close()

	logger.Info("metrics worker started", "group", metricsGroupID)
	return reader.Run(ctx)
}
