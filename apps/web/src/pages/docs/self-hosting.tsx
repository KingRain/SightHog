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
  { id: "quick", label: "Quick start" },
  { id: "ports", label: "Ports" },
  { id: "env", label: "Environment" },
  { id: "geoip", label: "GeoIP (optional)" },
  { id: "scaling", label: "Scaling" },
  { id: "swapping", label: "Swapping components" },
];

export function DocsSelfHosting() {
  return (
    <DocsLayout toc={TOC} active="/docs/self-hosting">
      <DocsHeading
        eyebrow="Backend"
        title="Self-hosting."
        description="Everything you need to run the full SightHog stack on your own infrastructure — laptop, VPS, or k8s cluster."
      />

      <DocsH2 id="quick">Quick start</DocsH2>
      <DocsP>
        The fastest path is a single{" "}
        <code className="font-mono text-sm">docker compose up</code> from the
        repo root:
      </DocsP>
      <div className="mt-4">
        <CodeBlock
          language="bash"
          filename="terminal"
          code={`git clone https://github.com/kingrain/sighthog.git
cd sighthog
cp .env.example .env
docker compose up --build`}
        />
      </div>

      <DocsH2 id="ports">Ports</DocsH2>
      <PropTable
        rows={[
          { name: "3000", type: "tcp", description: "Dashboard (Next.js)" },
          { name: "3001", type: "tcp", description: "Demo store (Next.js, optional)" },
          { name: "8080", type: "tcp", description: "Ingest API (Go)" },
          { name: "9092", type: "tcp", description: "Kafka (internal)" },
          { name: "9333", type: "tcp", description: "SeaweedFS admin" },
          { name: "8123", type: "tcp", description: "ClickHouse HTTP" },
          { name: "5432", type: "tcp", description: "Postgres (internal)" },
        ]}
      />

      <Callout variant="info" title="Reverse proxy in production">
        Only ports 80 and 443 should be exposed publicly. The dashboard
        lives at <code>/</code>, the ingest API at <code>/v1/events</code>,
        the demo store at <code>/demo</code>. Use Caddy, nginx, or Traefik.
      </Callout>

      <DocsH2 id="env">Environment</DocsH2>
      <DocsP>
        The <code className="font-mono text-sm">.env.example</code> file
        documents every variable. The most important ones:
      </DocsP>
      <PropTable
        rows={[
          { name: "DATABASE_URL", type: "string", description: "Postgres connection string. Format: postgres://user:pass@host:5432/db" },
          { name: "CLICKHOUSE_HTTP_URL", type: "string", description: "ClickHouse HTTP endpoint, e.g. http://clickhouse:8123" },
          { name: "KAFKA_BROKERS", type: "string", description: "Comma-separated Kafka brokers." },
          { name: "KAFKA_TOPIC", type: "string", default: "sighthog-raw-events", description: "Topic the ingest API publishes to." },
          { name: "SEAWEEDFS_ENDPOINT", type: "string", description: "S3-compatible endpoint, e.g. http://seaweedfs:8333" },
          { name: "SEAWEEDFS_BUCKET", type: "string", default: "sighthog-replays", description: "Bucket name for replay blobs." },
          { name: "CORS_ALLOWED_ORIGINS", type: "string", description: "Comma-separated origins allowed to POST /v1/events." },
          { name: "GEOLITE2_DB_PATH", type: "string", default: "/geo/GeoLite2-Country.mmdb", description: "Path to MaxMind GeoLite2 DB inside the ingest container." },
        ]}
      />

      <DocsH2 id="geoip">GeoIP (optional)</DocsH2>
      <DocsP>
        To populate the <code>country</code> field on sessions, drop a
        MaxMind GeoLite2 database at{" "}
        <code className="font-mono text-sm">infra/geoip/GeoLite2-Country.mmdb</code>{" "}
        and restart the ingest container.
      </DocsP>
      <DocsList>
        <DocsLi>
          Create a free account at{" "}
          <a
            className="text-foreground underline decoration-primary/40"
            href="https://www.maxmind.com/en/geolite2/signup"
            target="_blank"
            rel="noreferrer"
          >
            maxmind.com
          </a>
          .
        </DocsLi>
        <DocsLi>Download the GeoLite2 Country database (mmdb format).</DocsLi>
        <DocsLi>Place it at the path above (gitignored).</DocsLi>
        <DocsLi>
          <code>docker compose restart ingest-api</code>
        </DocsLi>
      </DocsList>
      <DocsP>
        Without the file, the SDK still works — <code>country</code> just
        gets stored as <code>Unknown</code> (or <code>LOCAL</code> for
        private IPs).
      </DocsP>

      <DocsH2 id="scaling">Scaling</DocsH2>
      <DocsP>
        The reference stack is sized for a single machine and a few million
        events per day. To go beyond that, scale horizontally:
      </DocsP>
      <ul className="mt-4 space-y-2 text-foreground/85 text-base leading-7 list-disc pl-5">
        <li>
          <strong>Ingest API:</strong> stateless. Run N replicas behind a
          load balancer.
        </li>
        <li>
          <strong>Workers:</strong> Kafka consumer groups. Each replica takes
          a share of the partitions. All three worker types
          (metadata/metrics/blob) scale independently.
        </li>
        <li>
          <strong>ClickHouse:</strong> use a replicated or clustered
          deployment, or swap in a managed service like ClickHouse Cloud.
        </li>
        <li>
          <strong>SeaweedFS:</strong> replace with S3, GCS, or any
          S3-compatible store by changing the endpoint.
        </li>
      </ul>

      <DocsH2 id="swapping">Swapping components</DocsH2>
      <DocsP>
        The SDK only depends on the ingest API. The ingest API only depends
        on Kafka. Each worker only depends on one database. You can swap
        any layer without rewriting the others.
      </DocsP>

      <DocsH3>Use S3 instead of SeaweedFS</DocsH3>
      <div className="mt-4">
        <CodeBlock
          language="bash"
          filename=".env"
          showLineNumbers={false}
          code={`SEAWEEDFS_ENDPOINT=https://s3.amazonaws.com
SEAWEEDFS_BUCKET=my-replays
SEAWEEDFS_ACCESS_KEY=...
SEAWEEDFS_SECRET_KEY=...`}
        />
      </div>

      <DocsH3>Use ClickHouse Cloud</DocsH3>
      <div className="mt-4">
        <CodeBlock
          language="bash"
          filename=".env"
          showLineNumbers={false}
          code={`CLICKHOUSE_HTTP_URL=https://xyz.clickhouse.cloud:8443
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=...`}
        />
      </div>

      <DocsH3>Use a different message bus</DocsH3>
      <DocsP>
        The ingest API uses the franz-go Kafka client. If you want NATS or
        RabbitMQ instead, fork{" "}
        <code className="font-mono text-sm">services/ingest-api</code> and
        swap the publisher — the rest of the pipeline is unaffected.
      </DocsP>
    </DocsLayout>
  );
}
