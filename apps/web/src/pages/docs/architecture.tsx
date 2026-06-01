import { CodeBlock } from "@/components/docs/code-block";
import {
  DocsLayout,
  DocsHeading,
  DocsH2,
  DocsH3,
  DocsP,
  DocsList,
  DocsLi,
  Callout,
  PropTable,
} from "@/components/docs/docs-layout";

const TOC = [
  { id: "overview", label: "Overview" },
  { id: "components", label: "Components" },
  { id: "flow", label: "Data flow" },
  { id: "topics", label: "Kafka topics" },
  { id: "databases", label: "Databases" },
];

export function DocsArchitecture() {
  return (
    <DocsLayout toc={TOC} active="/docs/architecture">
      <DocsHeading
        eyebrow="Backend"
        title="Architecture."
        description="How the pieces fit together. The system is decoupled at every boundary — you can scale, replace, or remove any layer without touching the rest."
      />

      <DocsH2 id="overview">Overview</DocsH2>
      <DocsP>
        The reference stack is a pipeline: browser → ingest API → Kafka →
        workers → databases. The dashboard reads from the databases and
        from the blob store.
      </DocsP>
      <div className="mt-5">
        <CodeBlock
          language="bash"
          showLineNumbers={false}
          code={`Browser (SDK on demo store)
        │
        ▼
  Ingest API (Go)  :8080
        │
        ▼
  Kafka (sighthog-raw-events)
        │
        +-- metadata worker --> PostgreSQL (sessions, users)
        +-- metrics worker  --> ClickHouse (events, interactions, telemetry)
        +-- blob worker     --> SeaweedFS (gzipped rrweb replays per session)
        │
        ▼
  Dashboard (Next.js)  :3000`}
        />
      </div>

      <DocsH2 id="components">Components</DocsH2>

      <DocsH3>Browser SDK</DocsH3>
      <DocsP>
        Pure browser code. Captures rrweb events, interactions, telemetry,
        and web vitals. Batches them and POSTs JSON to the ingest API. No
        server-side runtime required.
      </DocsP>
      <DocsList>
        <DocsLi>Repo: <code>packages/sdk</code></DocsLi>
        <DocsLi>Language: TypeScript</DocsLi>
        <DocsLi>Build: tsup → ESM + CJS + d.ts</DocsLi>
        <DocsLi>Peers: rrweb, web-vitals</DocsLi>
      </DocsList>

      <DocsH3>Ingest API</DocsH3>
      <DocsP>
        Thin Go HTTP server. Validates payloads, masks server-side PII
        patterns, parses the User-Agent into browser and OS, optionally
        resolves country from the client IP, and publishes a single JSON
        envelope to Kafka.
      </DocsP>
      <DocsList>
        <DocsLi>Repo: <code>services/ingest-api</code></DocsLi>
        <DocsLi>Language: Go 1.22+</DocsLi>
        <DocsLi>Endpoint: <code>POST /v1/events</code></DocsLi>
        <DocsLi>Client: franz-go (Kafka)</DocsLi>
      </DocsList>

      <DocsH3>Workers</DocsH3>
      <DocsP>
        Three independent Kafka consumer groups share a single topic. Each
        reads the same JSON envelope and writes to a different sink. They
        are stateless and can be replicated freely.
      </DocsP>

      <DocsH3>Dashboard</DocsH3>
      <DocsP>
        Next.js 15 app. Two pages: a session list with replay viewer, and
        an analytics dashboard with charts. Reads from Postgres, ClickHouse
        over HTTP, and SeaweedFS for replay blobs.
      </DocsP>

      <DocsH2 id="flow">Data flow</DocsH2>
      <DocsP>
        One event batch travels through the system like this:
      </DocsP>
      <ol className="mt-4 space-y-3 text-foreground/85 text-base leading-7 list-decimal pl-5">
        <li>
          The SDK batches rrweb events, interactions, and telemetry and
          POSTs to <code>/v1/events</code>. Each batch carries a persistent{" "}
          <code>visitorId</code> (localStorage), a <code>sessionId</code>{" "}
          (sessionStorage), a <code>referrer</code>, and an optional{" "}
          <code>userId</code>.
        </li>
        <li>
          The ingest API validates, enriches, masks, and publishes the
          payload to Kafka.
        </li>
        <li>
          The <strong>metadata worker</strong> upserts one Postgres row per{" "}
          <code>sessionId</code>, updating <code>updated_at</code> on later
          batches.
        </li>
        <li>
          The <strong>metrics worker</strong> writes ClickHouse rows for
          analytics charts and frustration detection.
        </li>
        <li>
          The <strong>blob worker</strong> merges rrweb events per session
          and uploads <code>&#123;sessionId&#125;.json.gz</code> to SeaweedFS.
        </li>
        <li>
          The dashboard reads Postgres for the session list, ClickHouse for
          charts, and SeaweedFS for replay files.
        </li>
      </ol>

      <Callout variant="success" title="Idempotency">
        Workers are designed to be safely replayable. Both the metadata
        upsert and the ClickHouse insert use the session id as a logical
        key, so re-processing a Kafka offset will not double-count events.
      </Callout>

      <DocsH2 id="topics">Kafka topics</DocsH2>
      <PropTable
        rows={[
          {
            name: "sighthog-raw-events",
            type: "string",
            description: "Default topic. JSON envelopes from the ingest API. 1 partition is enough for the reference stack.",
          },
          {
            name: "partition strategy",
            type: "string",
            description: "Default round-robin. For higher throughput, key by visitorId to keep one user's events ordered.",
          },
          {
            name: "retention",
            type: "string",
            default: "24h",
            description: "The blob worker drains to SeaweedFS within 30s, so 24h is plenty for a reference deployment.",
          },
        ]}
      />

      <DocsH2 id="databases">Databases</DocsH2>

      <DocsH3>PostgreSQL (metadata)</DocsH3>
      <DocsP>
        One row per session, updated on every batch. Schema is in{" "}
        <code className="font-mono text-sm">infra/postgres/migrate_analytics.sql</code>.
      </DocsP>
      <div className="mt-4">
        <CodeBlock
          language="bash"
          filename="postgres schema"
          showLineNumbers={false}
          code={`CREATE TABLE sessions (
  id           UUID PRIMARY KEY,
  visitor_id   UUID NOT NULL,
  user_id      TEXT,
  initial_url  TEXT NOT NULL,
  referrer     TEXT,
  country      TEXT,
  browser      TEXT,
  os           TEXT,
  device       TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_visitor ON sessions (visitor_id);
CREATE INDEX idx_sessions_updated ON sessions (updated_at DESC);`}
        />
      </div>

      <DocsH3>ClickHouse (events)</DocsH3>
      <DocsP>
        Column-oriented store for analytics. Two tables:{" "}
        <code className="font-mono text-sm">events</code> for telemetry and{" "}
        <code className="font-mono text-sm">interactions</code> for clicks.
        Schema in{" "}
        <code className="font-mono text-sm">infra/clickhouse/migrate_analytics.sql</code>.
      </DocsP>

      <DocsH3>SeaweedFS (blobs)</DocsH3>
      <DocsP>
        S3-compatible object storage. Stores one gzipped JSON file per
        session: <code className="font-mono text-sm">&#123;sessionId&#125;.json.gz</code>.
        Small (typically 50–500 kB per session) and read-only after upload.
        The dashboard streams it back and feeds it to the rrweb player.
      </DocsP>
    </DocsLayout>
  );
}
