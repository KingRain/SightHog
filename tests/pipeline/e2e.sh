#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

INGEST_URL="${INGEST_URL:-http://localhost:8080/v1/events}"
DASHBOARD_URL="${DASHBOARD_URL:-http://localhost:3000}"
SESSION_ID="${SESSION_ID:-$(uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid)}"
NOW_MS="$(date +%s000)"

echo "==> SightHog pipeline e2e"
echo "Session ID: $SESSION_ID"

payload=$(cat <<EOF
{
  "sessionId": "$SESSION_ID",
  "userId": "pipeline-e2e",
  "url": "http://localhost:3001/checkout",
  "timestamp": $NOW_MS,
  "events": [
    {"type": 2, "timestamp": $NOW_MS, "data": {"node": {"type": 0, "childNodes": []}}},
    {"type": 3, "timestamp": $((NOW_MS + 500)), "data": {"source": 1}}
  ],
  "interactions": [
    {"type": "pageview", "x": 0, "y": 0, "target": "window", "timestamp": $NOW_MS},
    {"type": "click", "x": 120, "y": 240, "target": "button#checkout", "timestamp": $((NOW_MS + 500))}
  ],
  "telemetry": [
    {
      "type": "console",
      "subType": "log",
      "message": "E2E test console log",
      "timestamp": $((NOW_MS + 100)),
      "metadata": {}
    },
    {
      "type": "network",
      "subType": "fetch",
      "message": "GET https://httpbin.org/get",
      "timestamp": $((NOW_MS + 200)),
      "metadata": {"status": 200, "durationMs": 42, "ok": true}
    },
    {
      "type": "vitals",
      "subType": "LCP",
      "message": "LCP: 1200",
      "timestamp": $((NOW_MS + 300)),
      "metadata": {"value": 1200, "rating": "good"}
    }
  ]
}
EOF
)

echo "==> POST ingest"
curl -sf -X POST "$INGEST_URL" \
  -H "Content-Type: application/json" \
  -d "$payload" >/dev/null

echo "==> Wait for workers (35s)"
sleep 35

echo "==> Dashboard metrics"
metrics="$(curl -sf "$DASHBOARD_URL/api/metrics")"
echo "$metrics" | grep -q 'pageview' || {
  echo "metrics missing pageview: $metrics"
  exit 1
}

echo "==> Dashboard sessions"
sessions="$(curl -sf "$DASHBOARD_URL/api/sessions")"
echo "$sessions" | grep -q "$SESSION_ID" || {
  echo "session not found in postgres list: $sessions"
  exit 1
}

echo "==> Dashboard replay"
replay="$(curl -sf "$DASHBOARD_URL/api/session/$SESSION_ID")"
echo "$replay" | grep -q '"hasFullSnapshot":true' || {
  echo "replay missing full snapshot: $replay"
  exit 1
}

echo "==> Dashboard telemetry"
telemetry="$(curl -sf "$DASHBOARD_URL/api/session/$SESSION_ID/telemetry")"
echo "$telemetry" | grep -q '"type":"console"' || {
  echo "telemetry missing console log: $telemetry"
  exit 1
}

echo "PASS: ingest -> workers -> dashboard APIs (including telemetry_logs)"
