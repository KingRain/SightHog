import { CodeBlock } from "@/components/docs/code-block";
import {
  DocsLayout,
  DocsHeading,
  DocsH2,
  DocsH3,
  DocsP,
  Callout,
} from "@/components/docs/docs-layout";

const TOC = [
  { id: "interactions", label: "Interactions" },
  { id: "telemetry", label: "Telemetry" },
  { id: "rrweb", label: "rrweb events" },
  { id: "schema", label: "Clickhouse schema" },
];

export function DocsEventTypes() {
  return (
    <DocsLayout toc={TOC} active="/docs/event-types">
      <DocsHeading
        eyebrow="SDK Reference"
        title="Event types."
        description="Every event the SDK emits, and where each one lands in the reference backend."
      />

      <DocsH2 id="interactions">Interactions</DocsH2>
      <DocsP>
        <code className="font-mono text-sm">interactions</code> in an
        EventBatch is an array of{" "}
        <code className="font-mono text-sm">InteractionEvent</code> objects.
        They land in the ClickHouse <code className="font-mono text-sm">interactions</code> table.
      </DocsP>

      <DocsH3>Click types</DocsH3>
      <div className="mt-4 space-y-4">
        <EventType
          name="click"
          desc="A standard left-click. Always emitted, never throttled."
          meta={`{ x, y, target, timestamp }`}
        />
        <EventType
          name="rage_click"
          desc="5+ clicks on the same target within 2s. Emitted once per window."
          meta={`{ frustration: "rage_click", target }`}
        />
        <EventType
          name="dead_click"
          desc="Click on a non-interactive element that produced no navigation, network call, or state change within 1.5s."
          meta={`{ frustration: "dead_click", target }`}
        />
        <EventType
          name="error_click"
          desc="Click followed by a network error or console error within 0.5s."
          meta={`{ frustration: "error_click", target }`}
        />
        <EventType
          name="scroll"
          desc="Throttled scroll event. Captured when the user moves more than ~50px between samples."
          meta={`{ x, y, target: "window", timestamp }`}
        />
        <EventType
          name="<custom>"
          desc="Any name you pass to trackEvent() shows up here."
          meta={`{ type: "checkout_complete", target: "/cart", metadata: { ... } }`}
        />
      </div>

      <DocsH2 id="telemetry">Telemetry</DocsH2>
      <DocsP>
        <code className="font-mono text-sm">telemetry</code> captures
        out-of-band signals that don't fit the click model. They land in the
        ClickHouse <code className="font-mono text-sm">events</code> table.
      </DocsP>

      <DocsH3>Network</DocsH3>
      <DocsP>
        Every <code className="font-mono text-sm">fetch()</code> call is
        patched. The SDK records method, URL, status, duration, and whether
        the response was OK. Calls to your own ingest endpoint are skipped to
        avoid recursive noise.
      </DocsP>
      <div className="mt-4">
        <CodeBlock
          language="json"
          filename="event batch"
          showLineNumbers={false}
          code={`{
  "type": "network",
  "subType": "fetch",
  "message": "POST /api/checkout",
  "timestamp": 1715000000000,
  "metadata": {
    "status": 500,
    "durationMs": 1284,
    "ok": false
  }
}`}
        />
      </div>

      <DocsH3>Console</DocsH3>
      <DocsP>
        <code className="font-mono text-sm">log</code>,{" "}
        <code className="font-mono text-sm">warn</code>,{" "}
        <code className="font-mono text-sm">error</code>, and{" "}
        <code className="font-mono text-sm">info</code> are wrapped. The
        original call still happens, so the user sees the log in their
        devtools.
      </DocsP>
      <div className="mt-4">
        <CodeBlock
          language="json"
          filename="event batch"
          showLineNumbers={false}
          code={`{
  "type": "console",
  "subType": "error",
  "message": "Uncaught: TypeError: Cannot read properties of undefined (reading 'price')",
  "timestamp": 1715000000000,
  "metadata": {
    "source": "https://app.example.com/cart.js",
    "lineno": 142,
    "colno": 18,
    "stack": "TypeError: ...\\n  at Cart.render (cart.js:142:18)"
  }
}`}
        />
      </div>

      <DocsH3>Web vitals</DocsH3>
      <DocsP>
        Powered by the <code className="font-mono text-sm">web-vitals</code>{" "}
        package. LCP, CLS, INP, and TTFB are streamed as they finalize.
      </DocsP>
      <div className="mt-4">
        <CodeBlock
          language="json"
          filename="event batch"
          showLineNumbers={false}
          code={`{
  "type": "vitals",
  "subType": "LCP",
  "message": "LCP: 1284",
  "timestamp": 1715000000000,
  "metadata": {
    "value": 1284,
    "rating": "good",
    "delta": 1284,
    "id": "v1-1234"
  }
}`}
        />
      </div>

      <DocsH2 id="rrweb">rrweb events</DocsH2>
      <DocsP>
        The <code className="font-mono text-sm">events</code> field is an
        array of raw rrweb event objects. The blob worker merges them per
        session and uploads the result as a gzipped file to SeaweedFS. The
        dashboard reads the file and feeds it to the rrweb player.
      </DocsP>
      <Callout variant="info" title="Not parsed by the backend">
        The ingest API does not inspect rrweb payloads. They're treated as
        opaque blobs. This means the SDK can be upgraded to a new rrweb
        version without touching any backend code.
      </Callout>

      <DocsH2 id="schema">Clickhouse schema</DocsH2>
      <DocsP>The reference schema (in <code>infra/clickhouse/migrate_analytics.sql</code>):</DocsP>
      <div className="mt-4">
        <CodeBlock
          language="bash"
          filename="migrate_analytics.sql"
          showLineNumbers={false}
          code={`CREATE TABLE sighthog.events (
  session_id   String,
  visitor_id   String,
  user_id      Nullable(String),
  type         LowCardinality(String),
  sub_type     LowCardinality(String),
  message      String,
  ts           DateTime64(3),
  metadata     String,   -- JSON
  url          String,
  INDEX idx_session session_id TYPE bloom_filter() GRANULARITY 3
) ENGINE = MergeTree
  PARTITION BY toYYYYMM(ts)
  ORDER BY (session_id, ts);

CREATE TABLE sighthog.interactions (
  session_id   String,
  visitor_id   String,
  type         LowCardinality(String),
  target       String,
  x            Nullable(Float32),
  y            Nullable(Float32),
  ts           DateTime64(3),
  metadata     String
) ENGINE = MergeTree
  PARTITION BY toYYYYMM(ts)
  ORDER BY (session_id, ts);`}
        />
      </div>
    </DocsLayout>
  );
}

function EventType({
  name,
  desc,
  meta,
}: {
  name: string;
  desc: string;
  meta: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-baseline justify-between gap-4">
        <code className="font-mono text-sm text-primary">{name}</code>
        <code className="font-mono text-[11px] text-muted truncate">{meta}</code>
      </div>
      <p className="mt-1.5 text-sm text-foreground/80 leading-6">{desc}</p>
    </div>
  );
}
