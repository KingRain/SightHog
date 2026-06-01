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
  { id: "init", label: "initSightHog" },
  { id: "stop", label: "stopSightHog" },
  { id: "track", label: "trackEvent" },
  { id: "getters", label: "Getters" },
  { id: "reset", label: "resetSightHogSession" },
  { id: "types", label: "Type exports" },
];

export function DocsApiReference() {
  return (
    <DocsLayout toc={TOC} active="/docs/api-reference">
      <DocsHeading
        eyebrow="SDK Reference"
        title="API reference."
        description="The complete public surface of @httperror/sighthog. All exports are tree-shakeable."
      />

      <Callout variant="info" title="Stable surface">
        These exports are part of the public API. Internal modules (anything
        under <code>src/</code> in the repo) are not exported and may change
        without notice.
      </Callout>

      <DocsH2 id="init">initSightHog(options)</DocsH2>
      <DocsP>
        Boots the SDK. Idempotent — a second call is a no-op until{" "}
        <code className="font-mono text-sm">stopSightHog()</code> is called.
      </DocsP>
      <div className="mt-5">
        <PropTable
          rows={[
            { name: "options.endpoint", type: "string", required: true, description: "Ingest API URL. POSTs JSON to this address." },
            { name: "options.sessionId", type: "string?", description: "Override the generated session id." },
            { name: "options.userId", type: "string?", description: "Tag all events for the tab with a user id." },
            { name: "options.flushIntervalMs", type: "number?", default: "5000", description: "Flush interval in ms." },
            { name: "options.maxBatchSize", type: "number?", default: "500", description: "Force-flush threshold for rrweb events." },
            { name: "options.maskSelectors", type: "string[]?", description: "CSS selectors to redact in the replay." },
            { name: "options.blockSelectors", type: "string[]?", description: "CSS selectors to exclude from the replay." },
            { name: "options.maskAllInputs", type: "boolean?", default: "false", description: "Mask every <input> value." },
          ]}
        />
      </div>
      <DocsP>Returns <code className="font-mono text-sm">void</code>.</DocsP>

      <DocsH2 id="stop">stopSightHog()</DocsH2>
      <DocsP>
        Tears down the SDK: detaches click, scroll, fetch, console, and
        error listeners; stops rrweb; unsubscribes from web vitals. Final
        flush uses <code className="font-mono text-sm">sendBeacon</code> if
        available.
      </DocsP>
      <div className="mt-5">
        <CodeBlock
          language="ts"
          filename="src/auth/logout.ts"
          code={`import { stopSightHog } from "@httperror/sighthog";

export function signOut() {
  stopSightHog();
}`}
        />
      </div>

      <DocsH2 id="track">trackEvent(name, metricValue?, metadata?)</DocsH2>
      <DocsP>
        Records a custom event with the current URL, timestamp, and an
        optional metric value or metadata. Events appear in the dashboard's
        event list and can be charted over time.
      </DocsP>
      <div className="mt-5">
        <PropTable
          rows={[
            { name: "name", type: "string", required: true, description: "Event name. e.g. \"checkout_complete\"." },
            { name: "metricValue", type: "number?", default: "1", description: "A numeric value to aggregate (e.g. cart total)." },
            { name: "metadata", type: "Record<string, unknown>?", description: "Arbitrary key-value payload. Serialized into ClickHouse." },
          ]}
        />
      </div>
      <div className="mt-5">
        <CodeBlock
          language="ts"
          filename="src/checkout.ts"
          code={`import { trackEvent } from "@httperror/sighthog";

trackEvent("checkout_complete", cartTotal, {
  itemCount: cart.items.length,
  paymentMethod: "card",
});`}
        />
      </div>

      <DocsH2 id="getters">Getters</DocsH2>

      <DocsH3>getSightHogSessionId(): string</DocsH3>
      <DocsP>
        Returns the session id for the current tab. Useful for support
        tooling.
      </DocsP>
      <div className="mt-4">
        <CodeBlock
          language="ts"
          code={`import { getSightHogSessionId } from "@httperror/sighthog";

const sid = getSightHogSessionId();`}
        />
      </div>

      <DocsH3>getSightHogVisitorId(): string</DocsH3>
      <DocsP>
        Returns the visitor id (stable across sessions for the same browser).
      </DocsP>
      <div className="mt-4">
        <CodeBlock
          language="ts"
          code={`import { getSightHogVisitorId } from "@httperror/sighthog";

const vid = getSightHogVisitorId();`}
        />
      </div>

      <DocsH2 id="reset">resetSightHogSession()</DocsH2>
      <DocsP>
        Clears the session id and user id from <code className="font-mono text-sm">sessionStorage</code>.
        The visitor id in <code className="font-mono text-sm">localStorage</code>{" "}
        is preserved. Call this when the previous user signs out so the next
        user starts with a fresh session row.
      </DocsP>

      <DocsH2 id="types">Type exports</DocsH2>
      <DocsP>
        The SDK re-exports the public types so you can build against them
        without copying interfaces.
      </DocsP>
      <div className="mt-5">
        <CodeBlock
          language="ts"
          code={`import type {
  SightHogOptions,
  EventBatch,
  InteractionEvent,
  TelemetryLog,
} from "@httperror/sighthog";`}
        />
      </div>

      <PropTable
        rows={[
          {
            name: "SightHogOptions",
            type: "interface",
            description: "The argument shape of initSightHog().",
          },
          {
            name: "EventBatch",
            type: "interface",
            description: "The payload shape POSTed to your endpoint on every flush.",
          },
          {
            name: "InteractionEvent",
            type: "interface",
            description: "One click, scroll, rage-click, dead-click, or error-click.",
          },
          {
            name: "TelemetryLog",
            type: "interface",
            description: "One network call, console log, or web vital.",
          },
        ]}
      />

      <DocsH3>EventBatch</DocsH3>
      <div className="mt-4">
        <CodeBlock
          language="ts"
          code={`interface EventBatch {
  sessionId: string;
  userId?: string;
  visitorId?: string;
  referrer?: string;
  url: string;
  timestamp: number;
  events: unknown[];           // rrweb events
  interactions: InteractionEvent[];
  telemetry?: TelemetryLog[];
}`}
        />
      </div>
    </DocsLayout>
  );
}
