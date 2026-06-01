"use client";

import { motion, useInView } from "motion/react";
import * as React from "react";
import {
  Globe,
  Server,
  Database,
  BarChart3,
  ArrowRight,
  PlayCircle,
  Layers,
  HardDrive,
} from "lucide-react";

import { SectionHeader } from "@/components/sections/features";
import { cn } from "@/lib/utils";

const STAGES = [
  {
    icon: <Globe className="size-5" strokeWidth={1.5} />,
    title: "Browser",
    description:
      "SDK captures rrweb events, clicks, console, network, and Web Vitals in batches.",
    color: "from-orange-500/20 to-orange-500/0",
    iconColor: "text-primary",
  },
  {
    icon: <Server className="size-5" strokeWidth={1.5} />,
    title: "Ingest API",
    description:
      "Go service validates, masks PII, enriches with GeoIP & UA, and publishes to Kafka.",
    color: "from-amber-500/20 to-amber-500/0",
    iconColor: "text-amber-400",
  },
  {
    icon: <Layers className="size-5" strokeWidth={1.5} />,
    title: "Kafka",
    description:
      "A single topic fans out to three independent worker pools processing in parallel.",
    color: "from-purple-500/20 to-purple-500/0",
    iconColor: "text-purple-400",
  },
  {
    icon: <Database className="size-5" strokeWidth={1.5} />,
    title: "Postgres + ClickHouse",
    description:
      "Session metadata lands in Postgres. Events & metrics flow into ClickHouse for fast analytics.",
    color: "from-emerald-500/20 to-emerald-500/0",
    iconColor: "text-emerald-400",
  },
  {
    icon: <HardDrive className="size-5" strokeWidth={1.5} />,
    title: "SeaweedFS",
    description:
      "gzipped rrweb events merged per session and stored as a single blob for replay.",
    color: "from-cyan-500/20 to-cyan-500/0",
    iconColor: "text-cyan-400",
  },
  {
    icon: <BarChart3 className="size-5" strokeWidth={1.5} />,
    title: "Dashboard",
    description:
      "Next.js UI replays sessions, charts analytics, slices by country, browser, and device.",
    color: "from-pink-500/20 to-pink-500/0",
    iconColor: "text-pink-400",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative py-20 sm:py-28">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="mx-auto max-w-6xl px-6">
        <SectionHeader
          eyebrow="How it works"
          title="A clean pipeline from browser to replay."
          description="The reference stack runs entirely on your infrastructure. Boring, predictable, debuggable — so you can focus on your product, not the telemetry layer."
        />

        <PipelineDiagram />
      </div>
    </section>
  );
}

function PipelineDiagram() {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <div ref={ref} className="mt-16">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {STAGES.map((stage, i) => (
          <React.Fragment key={stage.title}>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.5,
                delay: i * 0.08,
                ease: "easeOut",
              }}
              className={cn(
                "group relative rounded-2xl border border-border bg-card p-5 overflow-hidden",
              )}
            >
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                  stage.color,
                )}
              />
              <div className="relative flex items-start gap-4">
                <div
                  className={cn(
                    "size-10 shrink-0 rounded-xl border border-border bg-secondary flex items-center justify-center",
                    stage.iconColor,
                  )}
                >
                  {stage.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted/60">
                      0{i + 1}
                    </span>
                    <span className="text-xs uppercase tracking-[0.18em] text-muted/60">
                      step
                    </span>
                  </div>
                  <h3 className="mt-1 font-semibold text-foreground">
                    {stage.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-muted leading-relaxed">
                    {stage.description}
                  </p>
                </div>
              </div>
            </motion.div>
          </React.Fragment>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-3"
      >
        <a
          href="#use-cases"
          className="group inline-flex items-center gap-2 rounded-full border border-border bg-card hover:bg-secondary px-5 py-3 text-sm font-medium text-foreground transition-colors"
        >
          <PlayCircle className="size-4" strokeWidth={1.5} />
          See use cases
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-0.5"
            strokeWidth={1.5}
          />
        </a>
        <a
          href="/docs/architecture"
          className="group inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium text-muted hover:text-foreground transition-colors"
        >
          Read the architecture docs
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-0.5"
            strokeWidth={1.5}
          />
        </a>
      </motion.div>
    </div>
  );
}
