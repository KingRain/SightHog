package writer

import (
	"context"
	"fmt"
	"time"

	"github.com/ClickHouse/clickhouse-go/v2"
)

type EventRow struct {
	SessionID   string
	UserID      string
	URL         string
	EventName   string
	MetricValue float64
	Timestamp   time.Time
}

type InteractionRow struct {
	SessionID string
	URL       string
	Type      string
	X         uint16
	Y         uint16
	Target    string
	Timestamp time.Time
}

type TelemetryLogRow struct {
	SessionID string
	Type      string
	SubType   string
	Message   string
	Metadata  string
	Timestamp time.Time
}

type ClickHouseWriter struct {
	conn clickhouse.Conn
}

func NewClickHouseWriter(conn clickhouse.Conn) *ClickHouseWriter {
	return &ClickHouseWriter{conn: conn}
}

func (w *ClickHouseWriter) FlushEvents(ctx context.Context, rows []EventRow) error {
	if len(rows) == 0 {
		return nil
	}

	batch, err := w.conn.PrepareBatch(ctx, `
		INSERT INTO sighthog.events (
			session_id, user_id, url, event_name, metric_value, timestamp
		)
	`)
	if err != nil {
		return fmt.Errorf("prepare events batch: %w", err)
	}

	for _, row := range rows {
		if err := batch.Append(
			row.SessionID,
			row.UserID,
			row.URL,
			row.EventName,
			row.MetricValue,
			row.Timestamp,
		); err != nil {
			return fmt.Errorf("append event row: %w", err)
		}
	}

	if err := batch.Send(); err != nil {
		return fmt.Errorf("send events batch: %w", err)
	}
	return nil
}

func (w *ClickHouseWriter) FlushInteractions(ctx context.Context, rows []InteractionRow) error {
	if len(rows) == 0 {
		return nil
	}

	batch, err := w.conn.PrepareBatch(ctx, `
		INSERT INTO sighthog.interactions (
			session_id, url, type, x, y, target, timestamp
		)
	`)
	if err != nil {
		return fmt.Errorf("prepare interactions batch: %w", err)
	}

	for _, row := range rows {
		if err := batch.Append(
			row.SessionID,
			row.URL,
			row.Type,
			row.X,
			row.Y,
			row.Target,
			row.Timestamp,
		); err != nil {
			return fmt.Errorf("append interaction row: %w", err)
		}
	}

	if err := batch.Send(); err != nil {
		return fmt.Errorf("send interactions batch: %w", err)
	}
	return nil
}

func (w *ClickHouseWriter) FlushTelemetryLogs(ctx context.Context, rows []TelemetryLogRow) error {
	if len(rows) == 0 {
		return nil
	}

	batch, err := w.conn.PrepareBatch(ctx, `
		INSERT INTO sighthog.telemetry_logs (
			session_id, type, sub_type, message, metadata, timestamp
		)
	`)
	if err != nil {
		return fmt.Errorf("prepare telemetry_logs batch: %w", err)
	}

	for _, row := range rows {
		if err := batch.Append(
			row.SessionID,
			row.Type,
			row.SubType,
			row.Message,
			row.Metadata,
			row.Timestamp,
		); err != nil {
			return fmt.Errorf("append telemetry row: %w", err)
		}
	}

	if err := batch.Send(); err != nil {
		return fmt.Errorf("send telemetry_logs batch: %w", err)
	}
	return nil
}

func MsToTime(ms int64) time.Time {
	return time.UnixMilli(ms).UTC()
}
