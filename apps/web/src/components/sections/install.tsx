"use client";

import * as React from "react";
import { motion } from "motion/react";
import { Check, Terminal, Zap, Webhook } from "lucide-react";

import { CodeBlock } from "@/components/ui/code-block";
import { cn } from "@/lib/utils";

const SNIPPETS = {
  install: {
    label: "Install",
    icon: <Terminal className="size-3" strokeWidth={1.5} />,
    code: "npm install @sighthog/sdk",
    language: "bash" as const,
  },
  init: {
    label: "Initialize",
    icon: <Zap className="size-3" strokeWidth={1.5} />,
    code: `import { initSightHog, trackEvent } from "@sighthog/sdk";

initSightHog({
  endpoint: "https://ingest.your-app.com/v1/events",
  userId: currentUser?.id,
  maskSelectors: [".cc-number", "[data-private]"],
  maskAllInputs: true,
});

// anywhere in your app
trackEvent("checkout_complete", cartTotal);`,
    language: "tsx" as const,
  },
  webhook: {
    label: "Web vitals",
    icon: <Webhook className="size-3" strokeWidth={1.5} />,
    code: `import { onCLS, onINP, onLCP } from "web-vitals";

onCLS(console.log);
onINP(console.log);
onLCP(console.log);

// → "LCP: 1284", "CLS: 0.04", "INP: 96"
initSightHog({ endpoint: "/api/telemetry" });`,
    language: "tsx" as const,
  },
};

type Tab = keyof typeof SNIPPETS;

export function InstallSection() {
  const [tab, setTab] = React.useState<Tab>("init");

  return (
    <section id="install" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted">
              <span className="size-1.5 rounded-full bg-primary" />
              One line to install
            </span>
            <h2 className="mt-5 text-balance text-3xl sm:text-4xl md:text-5xl font-semibold tracking-[-0.03em] leading-[1.05] text-foreground">
              Drop the SDK in, get{" "}
              <span className="bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
                full visibility
              </span>{" "}
              out.
            </h2>
            <p className="mt-4 text-pretty text-base sm:text-lg leading-7 text-muted">
              No agents, no proxies, no vendor SDKs running on your users'
              devices. The SightHog bundle is &lt; 6 kB gzipped and ships as a
              standard ES module you can audit on npm.
            </p>

            <ul className="mt-8 space-y-3 text-sm text-foreground/80">
              {[
                "Auto-batches every 5s with sendBeacon fallback",
                "Stable visitorId across sessions, devices, origins",
                "Mask selectors, block selectors, mask all inputs",
                "Plays nicely with strict CSP & same-origin policies",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex size-5 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Check className="size-3" strokeWidth={2.5} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative"
          >
            <div
              className="absolute -inset-6 -z-10 rounded-[40px] opacity-60 blur-3xl"
              style={{
                background:
                  "radial-gradient(60% 60% at 50% 50%, rgba(255, 90, 31, 0.25), transparent 70%)",
              }}
            />
            <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between gap-3 border-b border-border bg-secondary/50 px-4 py-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-foreground/15" />
                  <span className="size-2.5 rounded-full bg-foreground/15" />
                  <span className="size-2.5 rounded-full bg-foreground/15" />
                </div>
                <div className="flex items-center gap-1 rounded-full bg-background/40 p-0.5">
                  {(Object.keys(SNIPPETS) as Tab[]).map((key) => {
                    const isActive = tab === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={cn(
                          "relative inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full transition-colors",
                          isActive
                            ? "text-foreground"
                            : "text-muted hover:text-foreground/70",
                        )}
                      >
                        {isActive && (
                          <motion.span
                            layoutId="snippet-pill"
                            className="absolute inset-0 rounded-full bg-foreground/10"
                            transition={{
                              type: "spring",
                              stiffness: 380,
                              damping: 30,
                            }}
                          />
                        )}
                        <span className="relative inline-flex items-center gap-1.5">
                          {SNIPPETS[key].icon}
                          {SNIPPETS[key].label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted/60">
                  {SNIPPETS[tab].language}
                </span>
              </div>
              <CodeBlock
                code={SNIPPETS[tab].code}
                language={SNIPPETS[tab].language}
                className="border-0 rounded-none shadow-none"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
