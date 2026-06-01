"use client";

import * as React from "react";
import { motion, useInView } from "motion/react";
import {
  MousePointerClick,
  Zap,
  ShieldCheck,
  TrendingUp,
  Cpu,
  Headphones,
} from "lucide-react";

import { SectionHeader } from "@/components/sections/features";
import { CodeBlock } from "@/components/ui/code-block";

const USE_CASES = [
  {
    icon: <MousePointerClick className="size-4" strokeWidth={1.5} />,
    title: "Rage-click alerts",
    body: "Detect 3+ rapid clicks on the same element within 1.2s and pipe the event into your alerting system.",
  },
  {
    icon: <Zap className="size-4" strokeWidth={1.5} />,
    title: "Core Web Vitals trends",
    body: "Stream INP, LCP, and CLS into ClickHouse and chart regressions by route, device, and country.",
  },
  {
    icon: <ShieldCheck className="size-4" strokeWidth={1.5} />,
    title: "Privacy-compliant replay",
    body: "Mask inputs, redact PII by selector, and never record cross-origin iframes out of the box.",
  },
  {
    icon: <TrendingUp className="size-4" strokeWidth={1.5} />,
    title: "Funnel analytics",
    body: "trackEvent() your way through checkout. Watch every drop-off in the dashboard replay.",
  },
  {
    icon: <Cpu className="size-4" strokeWidth={1.5} />,
    title: "Self-hosted & vendor-free",
    body: "Own every byte. Run on bare metal, K8s, or fly.io. No SaaS dashboard, no per-seat fees.",
  },
  {
    icon: <Headphones className="size-4" strokeWidth={1.5} />,
    title: "Support that just works",
    body: "User reports a bug? Paste their visitorId and you have the exact session, network log, and stack trace.",
  },
];

const PAYLOAD = `{
  "sessionId": "5f1a0000-0000-0000-0000-c0b2ee999999",
  "visitorId": "7d2e0000-0000-0000-0000-9a44ee999999",
  "userId": "user_42",
  "url": "https://app.example.com/checkout",
  "timestamp": 1715000000000,
  "interactions": [
    {
      "type": "rage_click",
      "target": "button#broken-checkout",
      "x": 412,
      "y": 280,
      "metadata": { "frustration": "rage_click" }
    }
  ],
  "telemetry": [
    {
      "type": "vitals",
      "subType": "LCP",
      "message": "LCP: 1284",
      "metadata": { "value": 1284, "rating": "good" }
    }
  ]
}`;

export function UseCases() {
  return (
    <section id="use-cases" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeader
          eyebrow="Use cases"
          title="Built for the teams that ship every day."
          description="From on-call SREs hunting a regression to PMs validating a funnel hypothesis — SightHog plugs into the way you already work."
        />

        <div className="mt-16 grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-16 items-start">
          <DemoCard />
          <ul className="grid sm:grid-cols-2 gap-3">
            {USE_CASES.map((uc, i) => (
              <motion.li
                key={uc.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="rounded-2xl border border-border bg-card p-4 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-2 text-foreground">
                  <span className="inline-flex size-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    {uc.icon}
                  </span>
                  <span className="font-medium">{uc.title}</span>
                </div>
                <p className="mt-2 text-sm text-muted leading-relaxed">
                  {uc.body}
                </p>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function DemoCard() {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <div ref={ref} className="relative">
      <div
        className="absolute -inset-4 -z-10 rounded-[40px] blur-3xl opacity-50"
        style={{
          background:
            "radial-gradient(50% 50% at 30% 30%, rgba(255, 90, 31, 0.25), transparent 70%)",
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="rounded-3xl border border-border bg-card overflow-hidden shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border bg-secondary/50 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="size-2 rounded-full bg-rose-500" />
            <span className="size-2 rounded-full bg-amber-500" />
            <span className="size-2 rounded-full bg-emerald-500" />
            <span className="ml-3 font-mono">/v1/events</span>
          </div>
          <span className="rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-medium px-2 py-0.5 border border-emerald-500/20">
            live
          </span>
        </div>

        <CodeBlock
          code={PAYLOAD}
          language="json"
          filename="POST /v1/events"
          showLineNumbers={false}
          className="border-0 rounded-none shadow-none"
        />

        <div className="border-t border-border bg-secondary/30 px-4 py-3 flex items-center gap-2 text-xs text-muted">
          <span className="inline-flex size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>sent with sendBeacon · 312 ms</span>
        </div>
      </motion.div>
    </div>
  );
}
