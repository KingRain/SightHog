import { CodeBlock } from "@/components/docs/code-block";
import {
  DocsLayout,
  DocsHeading,
  DocsH2,
  DocsH3,
  DocsP,
  Callout,
  PropTable,
} from "@/components/docs/docs-layout";

const TOC = [
  { id: "options", label: "Options" },
  { id: "batching", label: "Batching & flushing" },
  { id: "privacy", label: "Privacy options" },
  { id: "session", label: "Session & visitor ids" },
  { id: "examples", label: "Recipes" },
];

export function DocsConfiguration() {
  return (
    <DocsLayout toc={TOC} active="/docs/configuration">
      <DocsHeading
        eyebrow="Getting Started"
        title="Configuration."
        description="Every option accepted by initSightHog(), with defaults and examples."
      />

      <DocsH2 id="options">Options</DocsH2>
      <PropTable
        rows={[
          {
            name: "endpoint",
            type: "string",
            required: true,
            description:
              "Absolute URL of your ingest API. The SDK POSTs JSON to this address on every flush.",
          },
          {
            name: "sessionId",
            type: "string",
            description:
              "Override the auto-generated session id. Useful for server-side stitching.",
          },
          {
            name: "userId",
            type: "string",
            description:
              "Tag all events for this tab with a stable user id. Persists in sessionStorage.",
          },
          {
            name: "flushIntervalMs",
            type: "number",
            default: "5000",
            description:
              "How often the batcher flushes accumulated events. Lower = more realtime, higher bandwidth.",
          },
          {
            name: "maxBatchSize",
            type: "number",
            default: "500",
            description:
              "Force a flush once this many rrweb events have been buffered.",
          },
          {
            name: "maskSelectors",
            type: "string[]",
            description:
              "CSS selectors whose text content should be redacted in the replay (e.g. credit-card numbers).",
          },
          {
            name: "blockSelectors",
            type: "string[]",
            description:
              "CSS selectors that should be excluded from the replay entirely (e.g. chat widgets).",
          },
          {
            name: "maskAllInputs",
            type: "boolean",
            default: "false",
            description:
              "Mask every <input> value in the replay. Recommended for apps that handle sensitive data.",
          },
        ]}
      />

      <DocsH2 id="batching">Batching & flushing</DocsH2>
      <DocsP>
        The SDK buffers three streams independently and flushes them together
        on a timer. Flushing happens in any of these cases:
      </DocsP>
      <div className="mt-4">
        <ul className="space-y-2 text-foreground/85 text-base leading-7 list-disc pl-5">
          <li>
            Every <code className="font-mono text-sm">flushIntervalMs</code>{" "}
            (default 5s)
          </li>
          <li>
            When the buffer exceeds{" "}
            <code className="font-mono text-sm">maxBatchSize</code> rrweb
            events
          </li>
          <li>
            When{" "}
            <code className="font-mono text-sm">document.visibilityState</code>{" "}
            becomes <em>hidden</em>
          </li>
          <li>
            On the <code className="font-mono text-sm">beforeunload</code>{" "}
            event — using <code className="font-mono text-sm">sendBeacon</code>{" "}
            so the request survives navigation
          </li>
        </ul>
      </div>

      <Callout variant="success" title="No events lost on tab close">
        The final flush uses <code>navigator.sendBeacon</code>, which the
        browser guarantees to deliver even after the tab has closed. If the
        beacon isn't available, the SDK falls back to a{" "}
        <code>fetch()</code> with <code>keepalive: true</code>.
      </Callout>

      <DocsH2 id="privacy">Privacy options</DocsH2>
      <DocsP>
        Three layered mechanisms protect sensitive data. They can be combined
        freely:
      </DocsP>
      <div className="mt-4">
        <CodeBlock
          language="tsx"
          filename="src/main.tsx"
          code={`initSightHog({
  endpoint: "...",
  // 1. Redact text in matched elements (e.g. credit cards).
  maskSelectors: [".cc-number", ".ssn", "[data-private]"],
  // 2. Remove entire subtrees from the replay (e.g. chat widgets).
  blockSelectors: [".intercom-launcher", "#hubspot-iframe"],
  // 3. Mask every <input> value regardless of selector.
  maskAllInputs: true,
});`}
        />
      </div>

      <DocsP>
        A <code className="font-mono text-sm">MutationObserver</code> re-applies
        the mask and block classes to any nodes that are added to the DOM
        after init, so SPAs are covered automatically.
      </DocsP>

      <DocsH2 id="session">Session & visitor ids</DocsH2>
      <DocsP>
        The SDK maintains two identifiers, both auto-generated UUIDs:
      </DocsP>
      <div className="mt-4">
        <PropTable
          rows={[
            {
              name: "visitorId",
              type: "uuid",
              default: "generated",
              description:
                "Stored in localStorage. Stable across sessions, browsers, and origins for the same user.",
            },
            {
              name: "sessionId",
              type: "uuid",
              default: "generated",
              description:
                "Stored in sessionStorage. Rotates when the tab closes or resetSightHogSession() is called.",
            },
            {
              name: "userId",
              type: "string?",
              description:
                "Optional. Set by passing userId to initSightHog(). Persists in sessionStorage for the tab.",
            },
            {
              name: "referrer",
              type: "string",
              description:
                "Captured from document.referrer at init time, sent on the first batch.",
            },
          ]}
        />
      </div>

      <DocsH2 id="examples">Recipes</DocsH2>
      <DocsH3>High-traffic SPA with rate limiting</DocsH3>
      <div className="mt-4">
        <CodeBlock
          language="tsx"
          filename="src/main.tsx"
          code={`initSightHog({
  endpoint: "httpsingest.example.com/v1/events",
  flushIntervalMs: 10_000,   // 10s batches
  maxBatchSize: 1000,        // cap memory
  maskAllInputs: true,
});`}
        />
      </div>

      <DocsH3>Server-side rendering</DocsH3>
      <DocsP>
        The SDK guards every browser global. You can safely import it on the
        server — it just won't do anything until it's hydrated.
      </DocsP>
      <div className="mt-4">
        <CodeBlock
          language="tsx"
          filename="src/main.tsx"
          code={`// safe to import on the server; initSightHog() is a no-op there.
import { initSightHog } from "@sighthog/sdk";

if (typeof window !== "undefined") {
  initSightHog({ endpoint: "..." });
}`}
        />
      </div>

      <DocsH3>Conditional recording (opt-in)</DocsH3>
      <DocsP>
        If you want to record only specific user segments, gate the init call:
      </DocsP>
      <div className="mt-4">
        <CodeBlock
          language="tsx"
          filename="src/main.tsx"
          code={`if (currentUser?.consent.telemetry) {
  initSightHog({ endpoint: "..." });
}`}
        />
      </div>
    </DocsLayout>
  );
}
