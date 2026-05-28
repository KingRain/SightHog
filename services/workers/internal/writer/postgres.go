package writer

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sighthog/workers/internal/models"
)

type PostgresWriter struct {
	pool *pgxpool.Pool
}

func NewPostgresWriter(pool *pgxpool.Pool) *PostgresWriter {
	return &PostgresWriter{pool: pool}
}

func (w *PostgresWriter) UpsertSession(ctx context.Context, payload models.EnrichedPayload) error {
	if payload.UserID != "" {
		_, err := w.pool.Exec(ctx,
			`INSERT INTO users (id) VALUES ($1) ON CONFLICT (id) DO NOTHING`,
			payload.UserID,
		)
		if err != nil {
			return fmt.Errorf("upsert user: %w", err)
		}
	}

	var userID *string
	if payload.UserID != "" {
		userID = &payload.UserID
	}

	var visitorID *string
	if payload.VisitorID != "" {
		visitorID = &payload.VisitorID
	}

	var referrer *string
	if payload.Referrer != "" {
		referrer = &payload.Referrer
	}

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

	_, err := w.pool.Exec(ctx, `
		INSERT INTO sessions (
			id, user_id, initial_url, user_agent, client_ip,
			visitor_id, country, browser, os, referrer
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		ON CONFLICT (id) DO UPDATE SET
			updated_at = CURRENT_TIMESTAMP,
			user_agent = COALESCE(EXCLUDED.user_agent, sessions.user_agent),
			client_ip = COALESCE(EXCLUDED.client_ip, sessions.client_ip),
			visitor_id = COALESCE(EXCLUDED.visitor_id, sessions.visitor_id),
			country = COALESCE(EXCLUDED.country, sessions.country),
			browser = COALESCE(EXCLUDED.browser, sessions.browser),
			os = COALESCE(EXCLUDED.os, sessions.os),
			referrer = COALESCE(EXCLUDED.referrer, sessions.referrer)
	`, payload.SessionID, userID, payload.URL, payload.UserAgent, payload.ClientIP,
		visitorID, country, browser, osName, referrer)
	if err != nil {
		return fmt.Errorf("upsert session: %w", err)
	}

	return nil
}
