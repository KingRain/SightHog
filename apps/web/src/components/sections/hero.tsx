"use client";

import * as React from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowRight, Copy, Terminal, Container } from "lucide-react";

import { AuroraBars } from "@/components/ui/aurora-bars";

const SETUP_STEPS = [
  {
    step: "01",
    title: "Install",
    icon: <Terminal className="size-3.5" strokeWidth={1.5} />,
    code: "npm install @sighthog/sdk",
    hint: "one package, zero peers",
  },
  {
    step: "02",
    title: "Initialize",
    icon: <Copy className="size-3.5" strokeWidth={1.5} />,
    code: "initSightHog({ endpoint })",
    hint: "one function, three lines",
  },
  {
    step: "03",
    title: "Done",
    icon: <Container className="size-3.5" strokeWidth={1.5} />,
    code: "docker compose up",
    hint: "full pipeline on localhost",
  },
];

export function Hero() {
  const ref = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section
      ref={ref}
      id="top"
      className="relative isolate overflow-hidden pt-32 sm:pt-36 pb-24 sm:pb-32"
    >
      <div className="absolute inset-x-0 top-0 h-[780px] -z-10">
        <AuroraBars
          barCount={48}
          blur={26}
          gap={3}
          speed={0.32}
          maxHeightRatio={0.72}
          minHeightRatio={0.1}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />
        <div className="absolute inset-0 bg-grid opacity-25" />
      </div>

      <motion.div
        style={{ y, opacity }}
        className="relative mx-auto max-w-6xl px-6 text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 backdrop-blur px-3 py-1.5 text-xs text-foreground/80"
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-primary" />
          </span>
          <span>Live on GitHub · Apache 2.0</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="mt-8 font-serif font-normal tracking-[-0.035em] leading-[0.95] text-foreground text-[clamp(3rem,9vw,7.5rem)]"
        >
          Watch every{" "}
          <span className="relative inline-block">
            <span className="relative z-10 italic bg-gradient-to-br from-primary via-accent to-primary bg-clip-text text-transparent">
              user&nbsp;session
            </span>
            <svg
              className="absolute -bottom-2 left-0 w-full h-3 text-primary/40"
              viewBox="0 0 200 12"
              fill="none"
              preserveAspectRatio="none"
              aria-hidden
            >
              <motion.path
                d="M2 8 Q 50 2, 100 6 T 198 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, delay: 0.8, ease: "easeOut" }}
              />
            </svg>
          </span>
          <br className="hidden sm:block" />
          in your own backyard.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.35 }}
          className="mx-auto mt-8 max-w-2xl text-pretty text-lg sm:text-xl leading-7 text-muted"
        >
          SightHog is a <span className="text-foreground">drop-in browser SDK</span>{" "}
          that records rrweb session replay, rage-clicks, web vitals, and
          network logs — then ships them straight to{" "}
          <span className="text-foreground">your own</span> Kafka, Postgres, and
          ClickHouse. Open source. Self-hosted. No per-seat fees.
        </motion.p>

        {/* Three-step setup */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.5 }}
          className="mt-14"
        >
          <div className="text-[10px] sm:text-xs uppercase tracking-[0.22em] text-muted/60">
            Live in production in three lines
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto">
            {SETUP_STEPS.map((s, i) => (
              <SetupStep key={s.step} {...s} delay={0.6 + i * 0.1} />
            ))}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="#install"
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-fg hover:opacity-90 transition-all glow-primary"
            >
              Start the 60-second setup
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-0.5"
                strokeWidth={1.5}
              />
            </a>
            <a
              href="/docs"
              className="group inline-flex items-center gap-2 rounded-full border border-border bg-card/60 backdrop-blur px-5 py-3 text-sm font-medium text-foreground hover:bg-card transition-all"
            >
              Read the docs
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-0.5"
                strokeWidth={1.5}
              />
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="mt-20 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-xs uppercase tracking-[0.18em] text-muted/60"
        >
          <span>rrweb replay</span>
          <Dot />
          <span>Web Vitals</span>
          <Dot />
          <span>Frustration detection</span>
          <Dot />
          <span>Self-hostable</span>
        </motion.div>
      </motion.div>
    </section>
  );
}

function SetupStep({
  step,
  title,
  icon,
  code,
  hint,
  delay,
}: {
  step: string;
  title: string;
  icon: React.ReactNode;
  code: string;
  hint: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className="group relative rounded-2xl border border-border bg-card/70 backdrop-blur p-4 text-left hover:bg-card transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-muted/60 tracking-wider">
            {step}
          </span>
          <span className="text-foreground">{icon}</span>
        </div>
        <span className="text-[10px] uppercase tracking-[0.16em] text-muted/60">
          {title}
        </span>
      </div>
      <div className="mt-3 font-mono text-[13px] sm:text-sm text-foreground/90 leading-relaxed break-all">
        <span className="text-muted/50">$</span>{" "}
        <span className="text-primary">{code.split(" ")[0]}</span>{" "}
        <span className="text-foreground/80">
          {code.split(" ").slice(1).join(" ")}
        </span>
      </div>
      <div className="mt-2 text-[11px] text-muted">{hint}</div>
    </motion.div>
  );
}

function Dot() {
  return <span className="size-1 rounded-full bg-muted/40" aria-hidden />;
}
