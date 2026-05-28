package models

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
