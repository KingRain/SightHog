import { CodeBlock } from "@/components/docs/code-block";
import {
  DocsLayout,
  DocsHeading,
  DocsH2,
  DocsP,
  Callout,
  PropTable,
} from "@/components/docs/docs-layout";

const TOC = [
  { id: "endpoint", label: "Endpoint" },
  { id: "payload", label: "Payload" },
  { id: "headers", label: "Headers" },
  { id: "responses", label: "Responses" },
  { id: "alternative", label: "Build your own" },
];

export function DocsIngestApi() {
  return (
    <DocsLayout toc={TOC} active="/docs/ingest-api">
      <DocsHeading
        eyebrow="Backend"
        title="Ingest API."
        description="The HTTP contract between the browser SDK and your backend. The reference implementation is in services/ingest-api (Go); you can write your own in any language."
      />

      <DocsH2 id="endpoint">Endpoint</DocsH2>
      <div className="mt-3">
        <CodeBlock
          language="bash"
          filename="http"
          showLineNumbers={false}
          code={`POST /v1/events
Host: ingest.your-app.com
Content-Type: application/json`}
        />
      </div>

      <DocsH2 id="payload">Payload</DocsH2>
      <DocsP>
        One EventBatch per request. Identical to the TypeScript interface
        exported from the SDK as <code className="font-mono text-sm">EventBatch</code>.
      </DocsP>
      <div className="mt-4">
        <CodeBlock
          language="json"
          filename="request body"
          showLineNumbers={false}
          code={`{
  "sessionId": "5f1a0000-0000-0000-0000-c0b2ee999999",
  "visitorId": "7d2e0000-0000-0000-0000-9a44ee999999",
  "userId": "user_42",
  "referrer": "https://google.com",
  "url": "https://your-app.com/checkout",
  "timestamp": 1715000000000,
  "events": [
    { "type": 4, "data": { /* rrweb event */ } }
  ],
  "interactions": [
    {
      "type": "rage_click",
      "target": "button#broken-checkout",
      "x": 412,
      "y": 280,
      "timestamp": 1715000000000,
      "metadata": { "frustration": "rage_click" }
    }
  ],
  "telemetry": [
    {
      "type": "vitals",
      "subType": "LCP",
      "message": "LCP: 1284",
      "timestamp": 1715000000000,
      "metadata": { "value": 1284, "rating": "good" }
    }
  ]
}`}
        />
      </div>

      <PropTable
        rows={[
          { name: "sessionId", type: "string", required: true, description: "UUID. One per tab. sessionStorage." },
          { name: "visitorId", type: "string", required: true, description: "UUID. Stable across tabs and sessions. localStorage." },
          { name: "userId", type: "string?", description: "Optional. Set by passing userId to initSightHog()." },
          { name: "referrer", type: "string?", description: "Document referrer at init time." },
          { name: "url", type: "string", required: true, description: "Current page URL at the time the batch was flushed." },
          { name: "timestamp", type: "number", required: true, description: "ms since epoch. Wall-clock time when the batch was assembled." },
          { name: "events", type: "unknown[]", required: true, description: "rrweb events. Treated as opaque by the server." },
          { name: "interactions", type: "InteractionEvent[]", required: true, description: "Clicks, scrolls, custom events." },
          { name: "telemetry", type: "TelemetryLog[]?", description: "Network, console, vitals." },
        ]}
      />

      <DocsH2 id="headers">Headers</DocsH2>
      <DocsP>
        The SDK sets a few helpful headers on every request. Your endpoint
        can use them for routing and rate limiting.
      </DocsP>
      <PropTable
        rows={[
          { name: "Content-Type", type: "string", description: "application/json" },
          { name: "User-Agent", type: "string", description: "Browser UA. Parsed server-side into browser and OS." },
          { name: "X-Forwarded-For", type: "string?", description: "Set by your reverse proxy. Used to resolve country." },
          { name: "X-SightHog-Session", type: "string", description: "Mirrors sessionId. Useful for log-based debugging." },
        ]}
      />

      <DocsH2 id="responses">Responses</DocsH2>
      <PropTable
        rows={[
          { name: "204", type: "no content", description: "Success. No body." },
          { name: "400", type: "bad request", description: "Payload failed validation. The SDK logs and retries once." },
          { name: "413", type: "too large", description: "Payload exceeded 1 MB. The SDK drops the batch and continues." },
          { name: "429", type: "rate limited", description: "Too many requests. The SDK backs off exponentially." },
          { name: "5xx", type: "server error", description: "The SDK retries once with a 250 ms delay, then drops the batch." },
        ]}
      />

      <Callout variant="info" title="sendBeacon on tab close">
        When the SDK flushes via <code>sendBeacon</code> (e.g. on tab close),
        the browser delivers the request with a <code>Content-Type</code> of{" "}
        <code>application/json</code> inside a Blob. Your server should
        handle that without complaint. The Go reference implementation
        accepts both formats transparently.
      </Callout>

      <DocsH2 id="alternative">Build your own</DocsH2>
      <DocsP>
        The reference Go service is ~300 lines. It does five things:
      </DocsP>
      <ol className="mt-4 space-y-2 text-foreground/85 text-base leading-7 list-decimal pl-5">
        <li>Validate the payload against the EventBatch shape.</li>
        <li>Run the regex-based PII masker.</li>
        <li>Parse User-Agent into browser and OS (use the{" "}
          <code className="font-mono text-sm">ua-parser</code> package or similar).</li>
        <li>Optionally resolve country from <code>X-Forwarded-For</code>{" "}
          using GeoLite2.</li>
        <li>Publish the enriched envelope to Kafka.</li>
      </ol>
      <DocsP>
        You can replace it with a Cloudflare Worker, a Lambda, a FastAPI
        service, or anything else. The SDK doesn't care what runs on the
        other end.
      </DocsP>
    </DocsLayout>
  );
}
