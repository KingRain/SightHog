import { CodeBlock } from "@/components/docs/code-block";
import {
  DocsLayout,
  DocsHeading,
  DocsH2,
  DocsP,
  Callout,
} from "@/components/docs/docs-layout";

const TOC = [
  { id: "how", label: "How it works" },
  { id: "rage", label: "Rage clicks" },
  { id: "dead", label: "Dead clicks" },
  { id: "error", label: "Error clicks" },
  { id: "querying", label: "Querying in ClickHouse" },
];

export function DocsFrustration() {
  return (
    <DocsLayout toc={TOC} active="/docs/frustration">
      <DocsHeading
        eyebrow="SDK Reference"
        title="Frustration detection."
        description="Three heuristics run on the client with zero extra configuration. The signals are designed to be cheap, low-false-positive, and visible in your dashboard as filter chips."
      />

      <DocsH2 id="how">How it works</DocsH2>
      <DocsP>
        The frustration tracker runs entirely in the browser. It listens to
        three event sources:
      </DocsP>
      <ul className="mt-4 space-y-2 text-foreground/85 text-base leading-7 list-disc pl-5">
        <li>DOM <code>click</code> events (capturing phase)</li>
        <li>
          Patched <code>fetch()</code> (network activity)
        </li>
        <li>
          <code>onerror</code> + <code>unhandledrejection</code>
        </li>
      </ul>

      <DocsH2 id="rage">Rage clicks</DocsH2>
      <DocsP>
        5+ clicks on the same target (CSS selector path) within a rolling
        2-second window. The window is reset after the event is emitted to
        avoid double-counting the same rage burst.
      </DocsP>
      <div className="mt-4">
        <CodeBlock
          language="ts"
          filename="packages/sdk/src/frustration.ts"
          code={`const RAGE_CLICK_COUNT = 5;
const RAGE_CLICK_WINDOW_MS = 2000;

function checkRage(target: string, timestamp: number) {
  const window = rageWindows.get(target) ?? { target, timestamps: [] };
  window.timestamps = window.timestamps
    .filter((t) => timestamp - t <= RAGE_CLICK_WINDOW_MS)
    .concat(timestamp);

  if (window.timestamps.length >= RAGE_CLICK_COUNT) {
    emit("rage_click", target, timestamp);
    window.timestamps = [];
  }
}`}
        />
      </div>

      <Callout variant="info" title="Why 5 clicks in 2s?">
        Empirically, the bottom decile of rage-click sessions is around 4
        clicks in 1.5s. We picked 5 / 2s to bias toward precision over
        recall — fewer false positives, fewer legitimate bursts flagged.
      </Callout>

      <DocsH2 id="dead">Dead clicks</DocsH2>
      <DocsP>
        A click on an element that has no interactive role, no event handler,
        and produces no network call within 1.5 seconds. The tracker watches
        the patched <code>fetch()</code> wrapper to know whether the click
        actually did something.
      </DocsP>
      <div className="mt-4">
        <CodeBlock
          language="ts"
          filename="packages/sdk/src/frustration.ts"
          code={`const DEAD_CLICK_MS = 1500;

onClick(target) {
  const timer = setTimeout(() => {
    if (!pending.hadNetwork && !networkActivitySinceLastClick) {
      emit("dead_click", target, timestamp);
    }
  }, DEAD_CLICK_MS);
}`}
        />
      </div>

      <DocsH2 id="error">Error clicks</DocsH2>
      <DocsP>
        A click followed by either a{" "}
        <code className="font-mono text-sm">!response.ok</code> network call
        or a <code className="font-mono text-sm">console.error</code> within
        500ms. The tracker correlates the two streams by timestamp.
      </DocsP>
      <div className="mt-4">
        <CodeBlock
          language="ts"
          filename="packages/sdk/src/frustration.ts"
          code={`const ERROR_CLICK_WINDOW_MS = 500;

function checkErrorClicks(timestamp: number) {
  for (const pending of pendingClicks) {
    if (timestamp - pending.timestamp <= ERROR_CLICK_WINDOW_MS) {
      emit("error_click", pending.target, pending.timestamp);
    }
  }
  pendingClicks.length = 0;
}`}
        />
      </div>

      <DocsH2 id="querying">Querying in ClickHouse</DocsH2>
      <DocsP>
        The simplest dashboard query: top pages with rage-clicks in the last
        24 hours.
      </DocsP>
      <div className="mt-4">
        <CodeBlock
          language="bash"
          filename="clickhouse-client"
          showLineNumbers={false}
          code={`SELECT
  target,
  count() AS rage_clicks,
  uniq(session_id) AS affected_sessions
FROM sighthog.interactions
WHERE type = 'rage_click'
  AND ts > now() - INTERVAL 24 HOUR
GROUP BY target
ORDER BY rage_clicks DESC
LIMIT 20;`}
        />
      </div>
    </DocsLayout>
  );
}
