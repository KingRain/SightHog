package config

import (
	"os"
	"strconv"
	"time"
)

type Config struct {
	DatabaseURL  string
	KafkaBrokers string
	KafkaTopic   string

	PostgresHost     string
	PostgresPort     string
	PostgresUser     string
	PostgresPassword string
	PostgresDB       string

	ClickHouseHost     string
	ClickHousePort     string
	ClickHouseDB       string
	ClickHouseUser     string
	ClickHousePassword string

	SeaweedEndpoint  string
	SeaweedBucket    string
	SeaweedAccessKey string
	SeaweedSecretKey string

	ClickHouseBatchSize     int
	ClickHouseBatchInterval time.Duration
	BlobFlushInterval       time.Duration
}

func Load() Config {
	cfg := Config{
		DatabaseURL:  os.Getenv("DATABASE_URL"),
		KafkaBrokers: envOrFirst([]string{"KAFKA_BROKERS", "WORKERS_KAFKA_BROKERS"}, "localhost:9092"),
		KafkaTopic:   envOr("WORKERS_KAFKA_TOPIC", "sighthog-raw-events"),
		PostgresHost:     envOr("POSTGRES_HOST", "localhost"),
		PostgresPort:     envOr("POSTGRES_PORT", "5432"),
		PostgresUser:     envOr("POSTGRES_USER", "sighthog_user"),
		PostgresPassword: envOr("POSTGRES_PASSWORD", "sighthog_password"),
		PostgresDB:       envOr("POSTGRES_DB", "sighthog_metadata"),
		ClickHouseHost:          envOr("CLICKHOUSE_HOST", "localhost"),
		ClickHousePort:          envOr("CLICKHOUSE_PORT", "9000"),
		ClickHouseDB:            envOrFirst([]string{"CLICKHOUSE_DATABASE", "CLICKHOUSE_DB"}, "sighthog"),
		ClickHouseUser:          envOr("CLICKHOUSE_USER", "default"),
		ClickHousePassword:      envOr("CLICKHOUSE_PASSWORD", "password"),
		SeaweedEndpoint:         envOrFirst([]string{"SEAWEEDFS_ENDPOINT", "SEAWEEDFS_S3_ENDPOINT"}, "http://localhost:8333"),
		SeaweedBucket:           envOr("SEAWEEDFS_BUCKET", "sighthog-replays"),
		SeaweedAccessKey:        envOr("SEAWEEDFS_ACCESS_KEY", "any"),
		SeaweedSecretKey:        envOr("SEAWEEDFS_SECRET_KEY", "any"),
		ClickHouseBatchSize:     envIntOr("CLICKHOUSE_BATCH_SIZE", 2000),
		ClickHouseBatchInterval: time.Duration(envIntOr("CLICKHOUSE_BATCH_INTERVAL_MS", 3000)) * time.Millisecond,
		BlobFlushInterval:       time.Duration(envIntOr("BLOB_FLUSH_INTERVAL_MS", 30000)) * time.Millisecond,
	}
	return cfg
}

func (c Config) PostgresDSN() string {
	if c.DatabaseURL != "" {
		return c.DatabaseURL
	}
	return "postgres://" + c.PostgresUser + ":" + c.PostgresPassword + "@" + c.PostgresHost + ":" + c.PostgresPort + "/" + c.PostgresDB + "?sslmode=disable"
}

func (c Config) ClickHouseAddr() string {
	return c.ClickHouseHost + ":" + c.ClickHousePort
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func envOrFirst(keys []string, fallback string) string {
	for _, key := range keys {
		if v := os.Getenv(key); v != "" {
			return v
		}
	}
	return fallback
}

func envIntOr(key string, fallback int) int {
	if v := os.Getenv(key); v != "" {
		if parsed, err := strconv.Atoi(v); err == nil {
			return parsed
		}
	}
	return fallback
}
