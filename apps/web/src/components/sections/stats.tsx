"use client";

import * as React from "react";
import { motion, useInView } from "motion/react";

import { AnimateCount } from "@/components/ui/animate-count";

const STATS = [
  { value: 6, suffix: "kb", label: "gzipped runtime", sub: "minified, tree-shaken" },
  { value: 0, suffix: " deps", label: "production", sub: "except rrweb & web-vitals" },
  { value: 100, suffix: "%", label: "self-hostable", sub: "your data, your servers" },
  { value: 5, suffix: "s", label: "default flush", sub: "configurable per project" },
];

export function Stats() {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });

  return (
    <section ref={ref} className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px rounded-3xl bg-border border border-border overflow-hidden">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.6,
                delay: i * 0.08,
                ease: "easeOut",
              }}
              className="bg-card p-6 sm:p-8 flex flex-col gap-2"
            >
              <div className="flex items-baseline gap-1 text-foreground">
                <span className="text-4xl sm:text-5xl font-semibold tracking-tight">
                  <AnimateCount>{inView ? stat.value : 0}</AnimateCount>
                </span>
                <span className="text-base sm:text-lg text-muted font-medium">
                  {stat.suffix}
                </span>
              </div>
              <div className="mt-1">
                <div className="text-sm font-medium text-foreground">
                  {stat.label}
                </div>
                <div className="text-xs text-muted mt-0.5">{stat.sub}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
