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
  { id: "step-1", label: "1. Initialize" },
  { id: "step-2", label: "2. Tag with a user" },
  { id: "step-3", label: "3. Track custom events" },
  { id: "step-4", label: "4. Read session metadata" },
  { id: "step-5", label: "5. Stop on sign out" },
  { id: "next", label: "Next steps" },
];

export function DocsQuickStart() {
  return (
    <DocsLayout toc={TOC} active="/docs/quick-start">
      <DocsHeading
        eyebrow="Getting Started"
        title="Quick start."
        description="Five minutes from zero to your first captured session. Each step below corresponds to a real public export from the SDK."
      />

      <DocsH2 id="step-1">1. Initialize</DocsH2>
      <DocsP>
        Call <code className="font-mono text-sm">initSightHog</code> as early
        as possible in your app's lifecycle — top of the entry file, root
        layout, or main component. The function is idempotent: a second call
        is a no-op.
      </DocsP>
      <div className="mt-5">
        <CodeBlock
          language="tsx"
          filename="src/main.tsx"
          code={`import { initSightHog } from "@sighthog/sdk";

initSightHog({
  endpoint: "https://ingest.your-app.com/v1/events",
});`}
        />
      </div>

      <Callout variant="info" title="What happens internally">
        The SDK assigns a <code>visitorId</code> (stored in{" "}
        <code>localStorage</code>) and a <code>sessionId</code> (stored in{" "}
        <code>sessionStorage</code>), wires up <code>rrweb</code> for DOM
        replay, patches <code>fetch</code> and <code>console</code> for
        telemetry, subscribes to web vitals, and starts a 5-second flush
        timer.
      </Callout>

      <DocsH2 id="step-2">2. Tag with a user</DocsH2>
      <DocsP>
        Once a user signs in, pass their id. It'll appear on every event and
        let you search the dashboard by user.
      </DocsP>
      <div className="mt-5">
        <CodeBlock
          language="tsx"
          filename="src/auth/login.ts"
          code={`import { initSightHog, resetSightHogSession } from "@sighthog/sdk";

// after sign-in
initSightHog({
  endpoint: "https://ingest.your-app.com/v1/events",
  userId: currentUser.id,   // ← appears on every batch
});`}
        />
      </div>

      <DocsH2 id="step-3">3. Track custom events</DocsH2>
      <DocsP>
        Use <code className="font-mono text-sm">trackEvent()</code> for funnel
        and conversion events. Events appear in the dashboard with the
        current URL, timestamp, and your metadata payload.
      </DocsP>
      <div className="mt-5">
        <CodeBlock
          language="tsx"
          filename="src/cart/checkout.tsx"
          code={`import { trackEvent } from "@sighthog/sdk";

function completeCheckout(cartValue: number) {
  trackEvent("checkout_complete", cartValue);
  // ...
}

function addToCart(sku: string, price: number) {
  trackEvent("add_to_cart", 1, { sku, price });
}`}
        />
      </div>

      <DocsH2 id="step-4">4. Read session metadata</DocsH2>
      <DocsP>
        Two getters return the IDs the SDK generated for the current tab.
        Useful for support flows where a user pastes their id in a ticket.
      </DocsP>
      <div className="mt-5">
        <CodeBlock
          language="tsx"
          filename="src/support/widget.tsx"
          code={`import {
  getSightHogSessionId,
  getSightHogVisitorId,
} from "@sighthog/sdk";

function openSupportTicket() {
  const sessionId = getSightHogSessionId();
  const visitorId = getSightHogVisitorId();
  // POST these to your support backend
  return fetch("/api/support", {
    method: "POST",
    body: JSON.stringify({ sessionId, visitorId }),
  });
}`}
        />
      </div>

      <DocsH2 id="step-5">5. Stop on sign out</DocsH2>
      <DocsP>
        On sign out, call <code className="font-mono text-sm">stopSightHog()</code>{" "}
        and <code className="font-mono text-sm">resetSightHogSession()</code>.
        The first detaches all listeners. The second clears the session and
        user ids from <code className="font-mono text-sm">sessionStorage</code>{" "}
        so the next user starts fresh.
      </DocsP>
      <div className="mt-5">
        <CodeBlock
          language="tsx"
          filename="src/auth/logout.ts"
          code={`import { stopSightHog, resetSightHogSession } from "@sighthog/sdk";

export async function signOut() {
  await fetch("/api/auth/logout", { method: "POST" });
  stopSightHog();
  resetSightHogSession();
  // re-initialize for the next (anonymous) visitor
  initSightHog({ endpoint: "https://ingest.your-app.com/v1/events" });
}`}
        />
      </div>

      <DocsH3>Putting it all together</DocsH3>
      <DocsP>
        A typical app entry point looks like this. The whole thing fits on
        one screen:
      </DocsP>
      <div className="mt-5">
        <CodeBlock
          language="tsx"
          filename="src/main.tsx"
          code={`import { initSightHog, trackEvent } from "@sighthog/sdk";

// 1. Boot the SDK as early as possible.
initSightHog({
  endpoint: import.meta.env.VITE_SIGHT_HOG_ENDPOINT,
  maskSelectors: [".cc-number", "[data-private]"],
  maskAllInputs: true,
});

// 2. Track key funnel events.
document
  .querySelector("#checkout-button")
  ?.addEventListener("click", () => {
    trackEvent("checkout_complete", 1);
  });`}
        />
      </div>

      <DocsH2 id="next">Next steps</DocsH2>
      <DocsList>
        <DocsLi>
          <a className="text-foreground underline decoration-primary/40" href="/docs/configuration">
            Configuration
          </a>{" "}
          — every option, with examples for masking, batching, and storage.
        </DocsLi>
        <DocsLi>
          <a className="text-foreground underline decoration-primary/40" href="/docs/api-reference">
            API reference
          </a>{" "}
          — full type signatures for the public exports.
        </DocsLi>
        <DocsLi>
          <a className="text-foreground underline decoration-primary/40" href="/docs/privacy">
            Privacy & PII
          </a>{" "}
          — mask selectors, block selectors, and GDPR patterns.
        </DocsLi>
        <DocsLi>
          <a className="text-foreground underline decoration-primary/40" href="/docs/frustration">
            Frustration detection
          </a>{" "}
          — how rage, dead, and error clicks are computed.
        </DocsLi>
      </DocsList>
    </DocsLayout>
  );
}
