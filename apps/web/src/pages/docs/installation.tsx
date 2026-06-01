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
  { id: "install-sdk", label: "Install the SDK" },
  { id: "install-backend", label: "Run the backend" },
  { id: "verify", label: "Verify it works" },
  { id: "requirements", label: "Requirements" },
];

export function DocsInstallation() {
  return (
    <DocsLayout toc={TOC} active="/docs/installation">
      <DocsHeading
        eyebrow="Getting Started"
        title="Install."
        description="Two install paths: the SDK on its own, or the full self-hosted stack. Pick whichever you need — both work independently."
      />

      <DocsH2 id="install-sdk">Install the SDK</DocsH2>
      <DocsP>
        The SDK is published to npm as{" "}
        <code className="font-mono text-sm">@sighthog/sdk</code>. It has one
        runtime peer: <code className="font-mono text-sm">rrweb</code>.
      </DocsP>
      <div className="mt-5">
        <CodeBlock
          language="bash"
          filename="terminal"
          code={`# npm
npm install @sighthog/sdk

# pnpm
pnpm add @sighthog/sdk

# yarn
yarn add @sighthog/sdk`}
        />
      </div>

      <Callout variant="info" title="Bundle size">
        The SDK is tree-shakeable and ships at ~6 kB gzipped excluding
        <code>rrweb</code>. rrweb is dynamically loaded after init.
      </Callout>

      <DocsH3>Pick your framework</DocsH3>
      <DocsP>
        The SDK has zero opinions about frameworks. It works in any browser
        environment — vanilla JS, React, Vue, Svelte, Astro, etc. Just call{" "}
        <code className="font-mono text-sm">initSightHog()</code> once on
        mount.
      </DocsP>

      <DocsH3>Drop in the snippet</DocsH3>
      <DocsP>
        The fastest path is a 3-line initialization. Replace{" "}
        <code className="font-mono text-sm">YOUR_ENDPOINT</code> with the URL
        of your ingest API (see below).
      </DocsP>
      <div className="mt-5">
        <CodeBlock
          language="tsx"
          filename="app.tsx"
          code={`import { initSightHog } from "@sighthog/sdk";

initSightHog({
  endpoint: "https://ingest.your-app.com/v1/events",
});`}
        />
      </div>

      <DocsH2 id="install-backend">Run the backend</DocsH2>
      <DocsP>
        The backend is shipped as a{" "}
        <code className="font-mono text-sm">docker-compose.yml</code> at the
        root of the{" "}
        <a
          className="text-foreground underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
          href="https://github.com/kingrain/sighthog"
          target="_blank"
          rel="noreferrer"
        >
          github.com/kingrain/sighthog
        </a>{" "}
        repo. Clone it, then start the stack.
      </DocsP>
      <div className="mt-5">
        <CodeBlock
          language="bash"
          filename="terminal"
          code={`git clone https://github.com/kingrain/sighthog.git
cd sighthog
cp .env.example .env
docker compose up --build`}
        />
      </div>

      <DocsP>
        That's it. After a minute or two, the following services will be live
        on localhost:
      </DocsP>
      <div className="mt-5">
        <CodeBlock
          language="bash"
          filename="endpoints"
          showLineNumbers={false}
          code={`http://localhost:3000    Dashboard (sessions + replay)
http://localhost:3000/analytics   Web analytics
http://localhost:3001    Demo store (test traffic generator)
http://localhost:8080    Ingest API  (POST /v1/events)
http://localhost:9333    SeaweedFS admin`}
        />
      </div>

      <Callout variant="info" title="Prerequisites">
        Docker Desktop or Docker Engine 24+. The stack runs on roughly 4 GB
        of RAM. If you don't have Docker, see{" "}
        <a
          className="text-foreground underline decoration-primary/40"
          href="/docs/self-hosting"
        >
          self-hosting
        </a>{" "}
        for a bare-metal walkthrough.
      </Callout>

      <DocsH2 id="verify">Verify it works</DocsH2>
      <DocsList>
        <DocsLi>
          Open <code className="font-mono text-sm">http://localhost:3001</code>{" "}
          and click through <em>Home → Catalog → Product → Cart → Checkout</em>.
        </DocsLi>
        <DocsLi>
          On the <em>Home</em> page, rapid-click the red "Broken checkout
          button" to generate a rage-click event.
        </DocsLi>
        <DocsLi>
          Wait ~30 seconds for the blob worker to flush your replay.
        </DocsLi>
        <DocsLi>
          Open <code className="font-mono text-sm">http://localhost:3000</code>
          , hit <strong>Refresh</strong>, then click <strong>Watch</strong> on
          your session.
        </DocsLi>
        <DocsLi>
          Open the <strong>Analytics</strong> tab to see pageviews, unique
          visitors, country breakdown, and browser stats.
        </DocsLi>
      </DocsList>

      <DocsH3>Troubleshooting</DocsH3>
      <DocsP>
        If sessions don't appear, check the logs of the{" "}
        <code className="font-mono text-sm">ingest-api</code> container. The
        most common causes are:
      </DocsP>
      <DocsList>
        <DocsLi>
          <strong>CORS.</strong> Your app's origin must be in{" "}
          <code className="font-mono text-sm">CORS_ALLOWED_ORIGINS</code> in
          the <code className="font-mono text-sm">.env</code> file.
        </DocsLi>
        <DocsLi>
          <strong>Endpoint typo.</strong> The SDK will silently drop events
          with a malformed endpoint — confirm in the browser devtools network
          tab.
        </DocsLi>
        <DocsLi>
          <strong>Kafka cold start.</strong> The first batch can take ~10s
          while Kafka is bootstrapping.
        </DocsLi>
      </DocsList>

      <DocsH2 id="requirements">Requirements</DocsH2>
      <div className="mt-3">
        <CodeBlock
          language="bash"
          filename="terminal"
          showLineNumbers={false}
          code={`# SDK
Node.js 20+    (only for development)
Any modern browser (Chrome 90+, Firefox 90+, Safari 14+, Edge 90+)

# Backend
Docker 24+     (recommended for the full stack)
Node.js 20+    (for local app dev)
Go 1.22+       (for local ingest / worker dev)`}
        />
      </div>
    </DocsLayout>
  );
}
