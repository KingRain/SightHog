"use client";

import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

import { GithubIcon } from "@/components/icons";
import { AuroraBars } from "@/components/ui/aurora-bars";

export function CTA() {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <AuroraBars
          barCount={36}
          blur={22}
          gap={3}
          speed={0.4}
          maxHeightRatio={0.65}
          minHeightRatio={0.1}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      </div>

      <div className="mx-auto max-w-3xl px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-balance text-4xl sm:text-5xl md:text-6xl font-semibold tracking-[-0.04em] leading-[1.05] text-foreground"
        >
          Ship replay in the next{" "}
          <span className="bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
            five minutes.
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="mt-5 text-pretty text-lg text-muted max-w-xl mx-auto"
        >
          One npm install. One initSightHog() call. A dashboard of sessions
          waiting the moment your users land.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <a
            href="#install"
            className="group inline-flex items-center gap-2 rounded-full bg-primary text-primary-fg px-5 py-3 text-sm font-medium hover:opacity-90 transition-all glow-primary"
          >
            Get started
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-0.5"
              strokeWidth={1.5}
            />
          </a>
          <a
            href="https://github.com/kingrain/sighthog"
            className="group inline-flex items-center gap-2 rounded-full border border-border bg-card/60 backdrop-blur px-5 py-3 text-sm font-medium text-foreground hover:bg-card transition-all"
          >
            <GithubIcon className="size-4" />
            Star on GitHub
          </a>
        </motion.div>
      </div>
    </section>
  );
}
