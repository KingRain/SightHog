import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { GithubIcon } from "@/components/icons";
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
} from "@/components/docs/docs-layout";

const TOC = [
  { id: "what", label: "What is SightHog?" },
  { id: "philosophy", label: "The philosophy" },
  { id: "tech-stack", label: "The reference stack" },
  { id: "data-flow", label: "Data flow" },
  { id: "next", label: "Where to next" },
];

export function DocsIntro() {
  return (
    <DocsLayout toc={TOC} active="/docs">
      <DocsHeading
        eyebrow="Documentation"
        title="A self-hosted telemetry SDK you actually own."
        description="SightHog is a drop-in browser SDK plus a reference backend that captures session replay, frustration signals, and web vitals — then ships them to your own Kafka, Postgres, ClickHouse, and SeaweedFS. No SaaS, no per-seat fees, no agent in the way."
      />

      <div className="mb-10 flex flex-wrap items-center gap-3">
        <Link
          to="/docs/installation"
          className="group inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-fg hover:opacity-90 transition-opacity"
        >
          Install the SDK
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <a
          href="https://github.com/kingrain/sighthog"
          target="_blank"
          rel="noreferrer"
          className="group inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
        >
          <GithubIcon className="size-4" />
          kingrain/sighthog
        </a>
      </div>

      <DocsH2 id="what">What is SightHog?</DocsH2>
      <DocsP>
        SightHog is a full-stack, open-source platform for{" "}
        <em>session telemetry and AI-driven user behavior analytics</em>. It
        captures high-fidelity client-side interactions, processes them through
        a decoupled distributed pipeline, and surfaces real-time behavioral
        insights alongside synchronized developer debugging timelines.
      </DocsP>
      <div className="mt-4">
        <DocsP>
          The repo at{" "}
          <a
            className="text-foreground underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
            href="https://github.com/kingrain/sighthog"
            target="_blank"
            rel="noreferrer"
          >
            github.com/kingrain/sighthog
          </a>{" "}
          ships four things:
        </DocsP>
      </div>
      <div className="mt-4">
        <DocsList>
          <DocsLi>
            <code className="font-mono text-sm">@sighthog/sdk</code> — a
            browser SDK (rrweb replay, click telemetry, web vitals, frustration
            detection)
          </DocsLi>
          <DocsLi>
            <code className="font-mono text-sm">ingest-api</code> — a Go HTTP
            API that validates, masks, enriches, and publishes to Kafka
          </DocsLi>
          <DocsLi>
            <code className="font-mono text-sm">workers</code> — Kafka
            consumers that write to Postgres, ClickHouse, and SeaweedFS
          </DocsLi>
          <DocsLi>
            <code className="font-mono text-sm">apps/dashboard</code> — a
            Next.js UI for browsing sessions and replaying them
          </DocsLi>
        </DocsList>
      </div>

      <DocsH2 id="philosophy">The philosophy</DocsH2>
      <DocsP>
        Most analytics products lock you into their schema, their dashboards,
        and their pricing. SightHog is the opposite. The SDK only depends on
        a single HTTP endpoint. The ingest API only depends on Kafka. The
        workers only depend on three well-known databases. Replace any layer
        without rewriting the others.
      </DocsP>

      <Callout variant="success" title="Why teams pick SightHog">
        <ul className="space-y-1.5 list-none p-0">
          <li>
            <strong>Self-hostable.</strong> The whole stack is open source
            under Apache 2.0.
          </li>
          <li>
            <strong>Own your data.</strong> Replay files live in your S3-compatible bucket.
          </li>
          <li>
            <strong>Bring your own database.</strong> ClickHouse, Postgres,
            even DuckDB — if it can answer an HTTP query, it works.
          </li>
          <li>
            <strong>One line of code.</strong> <code>initSightHog(&#123;...&#125;)</code> and you're capturing sessions.
          </li>
        </ul>
      </Callout>

      <DocsH2 id="tech-stack">The reference stack</DocsH2>
      <DocsP>
        The reference stack runs in a single{" "}
        <code className="font-mono text-sm">docker compose up</code>:
      </DocsP>
      <div className="mt-5">
        <CodeBlock
          language="yaml"
          filename="docker-compose.yml"
          showLineNumbers={false}
          code={`services:
  ingest-api:    # Go,     :8080
  workers:       # Go,     consumes Kafka
  dashboard:     # Next.js, :3000
  demo:          # Next.js, :3001  (optional test store)
  kafka:         # Confluent images
  postgres:      # session metadata
  clickhouse:    # analytics events
  seaweedfs:     # replay blob storage`}
        />
      </div>

      <DocsH3>What's collected</DocsH3>
      <DocsList>
        <DocsLi>
          <strong>rrweb DOM replay</strong> — pixel-accurate playback of every
          mouse move, scroll, click, and input.
        </DocsLi>
        <DocsLi>
          <strong>Interactions</strong> — clicks, scrolls, rage-clicks, dead-clicks, error-clicks.
        </DocsLi>
        <DocsLi>
          <strong>Network telemetry</strong> — every <code>fetch()</code> with
          status, duration, and URL.
        </DocsLi>
        <DocsLi>
          <strong>Console telemetry</strong> — <code>log</code>,{" "}
          <code>warn</code>, <code>error</code>, <code>info</code>, plus
          uncaught errors and unhandled promise rejections.
        </DocsLi>
        <DocsLi>
          <strong>Web vitals</strong> — LCP, CLS, INP, TTFB streamed as they
          finalize.
        </DocsLi>
      </DocsList>

      <DocsH2 id="data-flow">Data flow</DocsH2>
      <DocsP>One event batch travels through the system like this:</DocsP>
      <div className="mt-5">
        <CodeBlock
          language="bash"
          showLineNumbers={false}
          code={`Browser SDK
  │  POST /v1/events  (every 5s, or sendBeacon on tab close)
  ▼
Ingest API (Go, :8080)
  │  validates, masks PII, parses UA, resolves country (optional GeoLite2)
  │  publishes JSON to Kafka
  ▼
Kafka topic  sighthog-raw-events
  │             │
  │             ├─► metadata worker ──► PostgreSQL   (sessions, users)
  │             ├─► metrics worker  ──► ClickHouse  (events, interactions, telemetry)
  │             └─► blob worker     ──► SeaweedFS   ({sessionId}.json.gz)
  ▼
Dashboard (Next.js, :3000)  ──► reads Postgres + ClickHouse + SeaweedFS`}
        />
      </div>

      <DocsH2 id="next">Where to next</DocsH2>
      <div className="mt-6 grid sm:grid-cols-2 gap-3">
        <NextLink
          href="/docs/installation"
          title="Installation"
          body="Install the SDK and start a local Docker stack in under five minutes."
        />
        <NextLink
          href="/docs/quick-start"
          title="Quick start"
          body="Drop the SDK into a real app and watch your first session land."
        />
        <NextLink
          href="/docs/api-reference"
          title="API reference"
          body="Every function, every option, every event payload."
        />
        <NextLink
          href="/docs/self-hosting"
          title="Self-hosting"
          body="The full docker-compose reference and how to swap pieces out."
        />
      </div>
    </DocsLayout>
  );
}

function NextLink({
  href,
  title,
  body,
}: {
  href: string;
  title: string;
  body: string;
}) {
  return (
    <Link
      to={href}
      className="group block rounded-2xl border border-border bg-card p-4 hover:bg-secondary/40 transition-colors"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <ArrowRight className="size-4 text-muted group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
      </div>
      <p className="mt-1.5 text-sm text-muted leading-relaxed">{body}</p>
    </Link>
  );
}
