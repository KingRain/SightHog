CREATE DATABASE IF NOT EXISTS sighthog;

CREATE TABLE IF NOT EXISTS sighthog.events (
    session_id UUID,
    user_id String,
    url String,
    event_name String,
    metric_value Float64,
    country LowCardinality(String) DEFAULT 'Unknown',
    visitor_id String DEFAULT '',
    browser LowCardinality(String) DEFAULT 'Unknown',
    os LowCardinality(String) DEFAULT 'Unknown',
    referrer String DEFAULT '',
    timestamp DateTime64(3),
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (event_name, timestamp, session_id);

CREATE TABLE IF NOT EXISTS sighthog.interactions (
    session_id UUID,
    url String,
    type String,
    x UInt16,
    y UInt16,
    target String,
    timestamp DateTime64(3)
) ENGINE = MergeTree()
ORDER BY (url, type, timestamp);

CREATE TABLE IF NOT EXISTS sighthog.telemetry_logs (
    session_id UUID,
    type LowCardinality(String),
    sub_type LowCardinality(String),
    message String,
    metadata String,
    timestamp DateTime64(3),
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (session_id, timestamp);
