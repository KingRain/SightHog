package validation

import (
	"errors"
	"strings"
)

type Interaction struct {
	Type      string  `json:"type"`
	X         float64 `json:"x,omitempty"`
	Y         float64 `json:"y,omitempty"`
	Target    string  `json:"target,omitempty"`
	Timestamp int64   `json:"timestamp"`
}

type TelemetryLog struct {
	Type      string         `json:"type"`
	SubType   string         `json:"subType"`
	Message   string         `json:"message"`
	Timestamp int64          `json:"timestamp"`
	Metadata  map[string]any `json:"metadata"`
}

type EventPayload struct {
	SessionID    string         `json:"sessionId"`
	UserID       string         `json:"userId,omitempty"`
	URL          string         `json:"url"`
	Timestamp    int64          `json:"timestamp"`
	Events       []any          `json:"events"`
	Interactions []Interaction  `json:"interactions"`
	Telemetry    []TelemetryLog `json:"telemetry"`
}

type EnrichedPayload struct {
	SessionID    string         `json:"sessionId"`
	UserID       string         `json:"userId,omitempty"`
	URL          string         `json:"url"`
	Timestamp    int64          `json:"timestamp"`
	Events       []any          `json:"events"`
	Interactions []Interaction  `json:"interactions"`
	Telemetry    []TelemetryLog `json:"telemetry"`
	ReceivedAt   int64          `json:"receivedAt"`
	ClientIP     string         `json:"clientIp"`
	UserAgent    string         `json:"userAgent"`
}

func Validate(payload *EventPayload) error {
	if payload == nil {
		return errors.New("payload is required")
	}
	if strings.TrimSpace(payload.SessionID) == "" {
		return errors.New("sessionId is required")
	}
	if strings.TrimSpace(payload.URL) == "" {
		return errors.New("url is required")
	}
	if payload.Timestamp <= 0 {
		return errors.New("timestamp must be a positive unix milliseconds value")
	}
	if len(payload.Events) == 0 && len(payload.Interactions) == 0 && len(payload.Telemetry) == 0 {
		return errors.New("events, interactions, or telemetry must be non-empty")
	}
	return nil
}
