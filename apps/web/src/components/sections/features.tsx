"use client";

import { motion } from "motion/react";
import {
  Activity,
  MousePointerClick,
  Gauge,
  ShieldCheck,
  Network,
  ScrollText,
  Eye,
  Layers,
} from "lucide-react";

import { HoverFeatureCards } from "@/components/ui/hover-feature-cards";

const FEATURES = [
  {
    name: "rrweb session replay",
    description:
      "Pixel-accurate DOM replay with full mouse, scroll, and input events. Encrypted at rest, masked by selector.",
    icon: <Activity className="size-5" strokeWidth={1.5} />,
    accent: "rgba(255, 90, 31, 0.18)",
    visual: "replay" as const,
  },
  {
    name: "rage & dead clicks",
    description:
      "Built-in frustration detection flags rapid repeat clicks and clicks on non-interactive elements automatically.",
    icon: <MousePointerClick className="size-5" strokeWidth={1.5} />,
    accent: "rgba(255, 138, 76, 0.18)",
    visual: "rage" as const,
  },
  {
    name: "web vitals",
    description:
      "LCP, CLS, INP, FCP, TTFB streamed as telemetry with route and device metadata for trending.",
    icon: <Gauge className="size-5" strokeWidth={1.5} />,
    accent: "rgba(74, 222, 128, 0.16)",
    visual: "vitals" as const,
  },
  {
    name: "privacy first",
    description:
      "Mask passwords, PII, and CSS-selected regions. Block entire subtrees (chat widgets, third-party iframes).",
    icon: <ShieldCheck className="size-5" strokeWidth={1.5} />,
    accent: "rgba(96, 165, 250, 0.16)",
    visual: "privacy" as const,
  },
  {
    name: "network & console",
    description:
      "Capture fetch, XHR, and WebSocket events. Stream console.warn / console.error with full stack traces.",
    icon: <Network className="size-5" strokeWidth={1.5} />,
    accent: "rgba(168, 85, 247, 0.18)",
    visual: "network" as const,
  },
  {
    name: "persistent identity",
    description:
      "Stable visitorId in localStorage, sessionId in sessionStorage, optional userId — survives reloads and SPAs.",
    icon: <ScrollText className="size-5" strokeWidth={1.5} />,
    accent: "rgba(244, 114, 182, 0.16)",
    visual: "identity" as const,
  },
  {
    name: "beacon flush",
    description:
      "Batched POSTs with sendBeacon fallback on tab close — never lose the last interaction of a session.",
    icon: <Eye className="size-5" strokeWidth={1.5} />,
    accent: "rgba(250, 204, 21, 0.16)",
    visual: "beacon" as const,
  },
  {
    name: "drop-in",
    description:
      "One initSightHog() call. Ship a tagged release to npm, bring your own ingest endpoint, no SaaS lock-in.",
    icon: <Layers className="size-5" strokeWidth={1.5} />,
    accent: "rgba(34, 211, 238, 0.16)",
    visual: "dropin" as const,
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeader
          eyebrow="What's inside"
          title="Everything you need to replay a session."
          description="An opinionated telemetry SDK for the browser. No dashboards, no vendors — just clean data, piped to your own pipeline."
        />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mt-14"
        >
          <HoverFeatureCards items={FEATURES} className="lg:grid-cols-2" />
        </motion.div>
      </div>
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
}) {
  return (
    <div
      className={
        align === "center"
          ? "mx-auto max-w-2xl text-center"
          : "max-w-2xl text-left"
      }
    >
      {eyebrow && (
        <motion.span
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted"
        >
          <span className="size-1.5 rounded-full bg-primary" />
          {eyebrow}
        </motion.span>
      )}
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="mt-5 text-balance text-3xl sm:text-4xl md:text-5xl font-semibold tracking-[-0.03em] leading-[1.05] text-foreground"
      >
        {title}
      </motion.h2>
      {description && (
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-4 text-pretty text-base sm:text-lg leading-7 text-muted"
        >
          {description}
        </motion.p>
      )}
    </div>
  );
}
