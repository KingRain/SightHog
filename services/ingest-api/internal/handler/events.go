package handler

import (
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sighthog/ingest-api/internal/geoip"
	"github.com/sighthog/ingest-api/internal/kafka"
	"github.com/sighthog/ingest-api/internal/pii"
	"github.com/sighthog/ingest-api/internal/useragent"
	"github.com/sighthog/ingest-api/internal/validation"
)

type EventsHandler struct {
	producer *kafka.Producer
	geoip    *geoip.Resolver
	logger   *slog.Logger
}

func NewEventsHandler(producer *kafka.Producer, geo *geoip.Resolver, logger *slog.Logger) *EventsHandler {
	return &EventsHandler{
		producer: producer,
		geoip:    geo,
		logger:   logger,
	}
}

func (h *EventsHandler) Healthz(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func (h *EventsHandler) IngestEvents(c *gin.Context) {
	requestID, _ := c.Get("requestID")

	var payload validation.EventPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		h.logger.Warn("invalid json payload", "requestID", requestID, "error", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid json payload"})
		return
	}

	if err := validation.Validate(&payload); err != nil {
		h.logger.Warn("validation failed", "requestID", requestID, "error", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	maskedEvents := pii.MaskEvents(payload.Events)
	maskedInteractions := make([]validation.Interaction, len(payload.Interactions))
	for i, interaction := range payload.Interactions {
		maskedInteractions[i] = validation.Interaction{
			Type:      interaction.Type,
			X:         interaction.X,
			Y:         interaction.Y,
			Target:    pii.MaskValue(interaction.Target),
			Timestamp: interaction.Timestamp,
		}
	}

	maskedTelemetry := make([]validation.TelemetryLog, len(payload.Telemetry))
	for i, entry := range payload.Telemetry {
		maskedMetadata := pii.MaskMap(entry.Metadata)
		if maskedMetadata == nil {
			maskedMetadata = map[string]any{}
		}
		maskedTelemetry[i] = validation.TelemetryLog{
			Type:      entry.Type,
			SubType:   entry.SubType,
			Message:   pii.MaskValue(entry.Message),
			Timestamp: entry.Timestamp,
			Metadata:  maskedMetadata,
		}
	}

	ip := clientIP(c)
	ua := c.GetHeader("User-Agent")
	browser, osName := useragent.ParseBrowserOS(ua)
	country := geoip.UnknownCountry
	if h.geoip != nil {
		country = h.geoip.CountryCode(ip)
	}

	enriched := validation.EnrichedPayload{
		SessionID:    payload.SessionID,
		UserID:       payload.UserID,
		VisitorID:    payload.VisitorID,
		Referrer:     payload.Referrer,
		URL:          payload.URL,
		Timestamp:    payload.Timestamp,
		Events:       maskedEvents,
		Interactions: maskedInteractions,
		Telemetry:    maskedTelemetry,
		ReceivedAt:   time.Now().UTC().UnixMilli(),
		ClientIP:     ip,
		UserAgent:    ua,
		Country:      country,
		Browser:      browser,
		OS:           osName,
	}

	if err := h.producer.Publish(c.Request.Context(), payload.SessionID, enriched); err != nil {
		h.logger.Error("failed to publish event", "requestID", requestID, "error", err)
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "failed to enqueue event"})
		return
	}

	h.logger.Info("event accepted",
		"requestID", requestID,
		"sessionId", payload.SessionID,
		"eventCount", len(payload.Events),
		"interactionCount", len(payload.Interactions),
		"telemetryCount", len(payload.Telemetry),
	)

	c.JSON(http.StatusAccepted, gin.H{
		"status":    "accepted",
		"sessionId": payload.SessionID,
	})
}

func clientIP(c *gin.Context) string {
	forwarded := c.GetHeader("X-Forwarded-For")
	if forwarded != "" {
		parts := strings.Split(forwarded, ",")
		return strings.TrimSpace(parts[0])
	}
	return c.ClientIP()
}
