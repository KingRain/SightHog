# SightHog

SightHog captures browser sessions (DOM replay, clicks, network, console) and stores them for analytics and playback in a dashboard.

## Architecture

```
Browser (SDK on demo store)
        |
        v
  Ingest API (Go)  :8080
        |
        v
  Kafka (sighthog-raw-events)
        |
        +-- metadata worker --> PostgreSQL (sessions, users)
        +-- metrics worker  --> ClickHouse (events, interactions, telemetry)
        +-- blob worker     --> SeaweedFS (gzipped rrweb replays per session)
        |
        v
  Dashboard (Next.js)  :3000
```

### Data flow

1. The SDK batches rrweb events, interactions, and telemetry and POSTs to `/v1/events`.
2. The ingest API validates payloads, masks sensitive fields, and publishes to Kafka.
3. Workers consume the same topic in parallel:
   - **Metadata** upserts one Postgres row per `sessionId` (updates `updated_at` on later batches).
   - **Metrics** writes ClickHouse rows for analytics charts and frustration detection.
   - **Blob** merges rrweb events per session and uploads `{sessionId}.json.gz` to object storage.
4. The dashboard reads Postgres for the session list, ClickHouse for charts, and SeaweedFS for replay files.

The demo store is a separate Next.js app on port 3001. It uses client-side routing across multiple pages while keeping one `sessionId` in `sessionStorage`, so you should see a single session row after browsing Home, Catalog, Product, Cart, and Checkout.

## Screenshots

<!-- Add architecture diagram image here -->
<!-- docs/images/architecture.png -->

<!-- Add dashboard replay screenshot here -->
<!-- docs/images/replay-workspace.png -->

## Prerequisites

- Docker Desktop (recommended for full stack)
- Node.js 20+ (optional, for local app development)
- Go 1.22+ (optional, for ingest API development)

## Quick start (Docker)

```bash
cp .env.example .env
docker compose up --build
```

| URL | Service |
|-----|---------|
| http://localhost:3000 | Dashboard |
| http://localhost:3001 | Demo store (Next.js, multi-page) |
| http://localhost:8080 | Ingest API |
| http://localhost:9333 | SeaweedFS admin |

### Test the pipeline

1. Open http://localhost:3001 and click through several pages (use the nav: Home, Catalog, Product, Cart, Checkout).
2. On Home, try rapid clicks on the red “Broken checkout button” to generate rage-click events.
3. Wait about 30 seconds for workers to flush replay blobs.
4. Open http://localhost:3000, click **Refresh** on the session list, then **Watch** on your session.
5. Use **Clear all sessions** on the dashboard to wipe Postgres, ClickHouse, and stored replays before another test run.

## Project layout

| Path | Role |
|------|------|
| `packages/sdk` | Browser SDK (rrweb, telemetry, funnel events, frustration detection) |
| `apps/demo` | Next.js demo store for generating traffic |
| `apps/dashboard` | Next.js control center and replay player |
| `services/ingest-api` | Go HTTP API and Kafka producer |
| `services/workers` | Kafka consumers (Postgres, ClickHouse, SeaweedFS) |
| `infra/` | Init scripts for Kafka, Postgres, ClickHouse, SeaweedFS |

## Local development (without rebuilding all containers)

Kafka and databases via Docker:

```bash
docker compose up kafka kafka-init postgres clickhouse seaweedfs seaweed-init
```

Ingest API:

```bash
cd services/ingest-api
go run ./cmd/server
```

Workers:

```bash
cd services/workers
go run ./cmd/processor
```

SDK:

```bash
cd packages/sdk
npm install && npm run build
```

Demo store:

```bash
cd apps/demo
npm install
npm run dev
```

Dashboard:

```bash
cd apps/dashboard
npm install
npm run dev
```

Set `NEXT_PUBLIC_SDK_ENDPOINT=http://localhost:8080/v1/events` for the demo app.

## Environment

Copy `.env.example` to `.env` before `docker compose up`. Important variables:

- `DATABASE_URL` — Postgres for session metadata
- `CLICKHOUSE_HTTP_URL` — analytics queries from the dashboard
- `SEAWEEDFS_ENDPOINT` / `SEAWEEDFS_BUCKET` — replay object storage
- `CORS_ALLOWED_ORIGINS` — must include demo and dashboard origins
- `NEXT_PUBLIC_DEMO_URL` — link from dashboard to the demo store

## Verification commands

Postgres sessions:

```bash
docker compose exec postgres psql -U sighthog_user -d sighthog_metadata -c "SELECT id, initial_url, updated_at FROM sessions ORDER BY updated_at DESC LIMIT 10;"
```

ClickHouse event counts:

```bash
docker compose exec clickhouse clickhouse-client --user default --password password --query "SELECT event_name, count() FROM sighthog.events GROUP BY event_name;"
```

## License

Apache 2.0. See [LICENSE](LICENSE).
