package config

import (
	"os"
	"strconv"
	"strings"
)

type Config struct {
	KafkaBrokers     string
	KafkaTopic       string
	Port             string
	MaxBodyBytes     int64
	CORSAllowOrigins []string
}

func Load() Config {
	maxBody := int64(2 * 1024 * 1024)
	if v := os.Getenv("MAX_BODY_BYTES"); v != "" {
		if parsed, err := strconv.ParseInt(v, 10, 64); err == nil {
			maxBody = parsed
		}
	}

	port := os.Getenv("INGEST_API_PORT")
	if port == "" {
		port = "8080"
	}

	brokers := os.Getenv("KAFKA_BROKERS")
	if brokers == "" {
		brokers = "localhost:9092"
	}

	topic := os.Getenv("KAFKA_TOPIC")
	if topic == "" {
		topic = "sighthog-raw-events"
	}

	return Config{
		KafkaBrokers:     brokers,
		KafkaTopic:       topic,
		Port:             port,
		MaxBodyBytes:     maxBody,
		CORSAllowOrigins: parseCSVEnv("CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001"),
	}
}

func parseCSVEnv(key, fallback string) []string {
	raw := os.Getenv(key)
	if raw == "" {
		raw = fallback
	}

	parts := strings.Split(raw, ",")
	out := make([]string, 0, len(parts))
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part != "" {
			out = append(out, part)
		}
	}
	return out
}
