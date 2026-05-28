#!/bin/bash
set -e

KAFKA_BIN="/opt/kafka/bin"

echo "Waiting for Kafka to be ready..."
until "$KAFKA_BIN/kafka-broker-api-versions.sh" --bootstrap-server kafka:9092 > /dev/null 2>&1; do
  sleep 2
done

echo "Creating topic sighthog-raw-events..."
"$KAFKA_BIN/kafka-topics.sh" \
  --bootstrap-server kafka:9092 \
  --create \
  --if-not-exists \
  --topic sighthog-raw-events \
  --partitions 3 \
  --replication-factor 1

echo "Topic sighthog-raw-events ready."
