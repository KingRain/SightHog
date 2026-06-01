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
  { id: "philosophy", label: "Privacy philosophy" },
  { id: "mask-selectors", label: "Mask selectors" },
  { id: "block-selectors", label: "Block selectors" },
  { id: "inputs", label: "Mask all inputs" },
  { id: "spa", label: "Single-page apps" },
  { id: "backend", label: "Backend masking" },
  { id: "gdpr", label: "GDPR & consent" },
];

export function DocsPrivacy() {
  return (
    <DocsLayout toc={TOC} active="/docs/privacy">
      <DocsHeading
        eyebrow="SDK Reference"
        title="Privacy & PII."
        description="SightHog is designed to be safe by default. The SDK never captures cross-origin iframes, ships with a layered masking system, and the backend can mask common sensitive patterns at ingest."
      />

      <DocsH2 id="philosophy">Privacy philosophy</DocsH2>
      <DocsP>
        The right place to mask PII is as close to the source as possible.
        That's why the SDK offers three layered mechanisms applied at the DOM
        level, before anything leaves the browser.
      </DocsP>

      <DocsH2 id="mask-selectors">Mask selectors</DocsH2>
      <DocsP>
        Pass any CSS selector to{" "}
        <code className="font-mono text-sm">maskSelectors</code>. Text inside
        matching elements is replaced with a static placeholder in the
        replay. The element's structure, position, and styling are
        preserved.
      </DocsP>
      <div className="mt-4">
        <CodeBlock
          language="tsx"
          filename="src/main.tsx"
          code={`initSightHog({
  endpoint: "...",
  maskSelectors: [
    ".credit-card",          // explicit class
    "[data-private]",        // data-attribute convention
    ".user-email",           // shown-but-redacted
    "input[type=email]",      // any email input
  ],
});`}
        />
      </div>
      <DocsP>
        Internally the SDK adds the class{" "}
        <code className="font-mono text-sm">sighthog-mask</code> to matching
        elements, and rrweb is configured to redact text in that class.
      </DocsP>

      <DocsH2 id="block-selectors">Block selectors</DocsH2>
      <DocsP>
        For subtrees that should not appear in the replay at all — chat
        widgets, third-party iframes, video players — use{" "}
        <code className="font-mono text-sm">blockSelectors</code>. Matching
        subtrees are excluded entirely, not just redacted.
      </DocsP>
      <div className="mt-4">
        <CodeBlock
          language="tsx"
          filename="src/main.tsx"
          code={`initSightHog({
  endpoint: "...",
  blockSelectors: [
    "#intercom-launcher",
    ".hubspot-iframe",
    "[data-embed='third-party']",
  ],
});`}
        />
      </div>

      <DocsH2 id="inputs">Mask all inputs</DocsH2>
      <DocsP>
        <code className="font-mono text-sm">maskAllInputs: true</code> is a
        short-cut that masks every{" "}
        <code className="font-mono text-sm">&lt;input&gt;</code>,{" "}
        <code className="font-mono text-sm">&lt;textarea&gt;</code>, and{" "}
        <code className="font-mono text-sm">contenteditable</code> value in
        the replay. Recommended for apps that handle passwords, payment
        info, or government identifiers.
      </DocsP>

      <Callout variant="warn" title="Inputs are captured, not transmitted">
        Even without <code>maskAllInputs</code>, the SDK never sends the
        password field of <code>type="password"</code> inputs — rrweb
        filters those out by default. <code>maskAllInputs</code> extends
        that protection to every other input.
      </Callout>

      <DocsH2 id="spa">Single-page apps</DocsH2>
      <DocsP>
        The SDK installs a{" "}
        <code className="font-mono text-sm">MutationObserver</code> on{" "}
        <code className="font-mono text-sm">document.documentElement</code>.
        Whenever a new node is added that matches a mask or block selector,
        the appropriate class is applied immediately. This means route
        changes in React, Vue, Svelte, and Astro are covered without any
        extra configuration.
      </DocsP>

      <DocsH2 id="backend">Backend masking</DocsH2>
      <DocsP>
        The Go ingest API runs a second pass of regex-based masking on every
        batch, catching common patterns the SDK might miss:
      </DocsP>
      <ul className="mt-4 space-y-2 text-foreground/85 text-base leading-7 list-disc pl-5">
        <li>Credit card numbers (Luhn-validated 13–19 digit sequences)</li>
        <li>US Social Security numbers (NNN-NN-NNNN)</li>
        <li>Email addresses in console messages</li>
        <li>Bearer tokens in network headers</li>
      </ul>
      <DocsP>
        If you need to extend the patterns, edit{" "}
        <code className="font-mono text-sm">services/ingest-api/internal/mask/mask.go</code>{" "}
        and rebuild the container.
      </DocsP>

      <DocsH2 id="gdpr">GDPR & consent</DocsH2>
      <DocsP>
        SightHog doesn't ship a consent banner — that's your responsibility
        under GDPR / CCPA. The recommended pattern is to gate the init call
        on consent:
      </DocsP>
      <div className="mt-4">
        <CodeBlock
          language="tsx"
          filename="src/main.tsx"
          code={`import { initSightHog } from "@sighthog/sdk";

function onConsentAccepted() {
  initSightHog({
    endpoint: "https://ingest.your-app.com/v1/events",
  });
}

// hook this into your consent banner's accept button
document
  .querySelector("#accept-analytics")
  ?.addEventListener("click", onConsentAccepted);`}
        />
      </div>

      <DocsH3>Right to be forgotten</DocsH3>
      <DocsP>
        The reference backend doesn't auto-delete on user request — that
        would require a UUID-to-PII mapping you probably don't have.
        Instead, expose a{" "}
        <code className="font-mono text-sm">DELETE FROM sessions WHERE
        visitor_id = ?</code> endpoint in your admin tool and run it on
        request. Replay blobs in SeaweedFS can be deleted directly with{" "}
        <code className="font-mono text-sm">weed shell</code>.
      </DocsP>
    </DocsLayout>
  );
}
