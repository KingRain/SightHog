"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";

import { cn } from "@/lib/utils";

const ANIMATE_COUNT_DURATION_MS = 450;
const EASING = [0.23, 0.88, 0.26, 0.92] as const;

interface AnimateCountProps {
  children: number;
  animate?: boolean;
  className?: string;
}

export function AnimateCount({
  children: count,
  animate = true,
  className,
}: AnimateCountProps) {
  const [rendered, setRendered] = React.useState<{
    current: number;
    previous: number | null;
  }>({ current: count, previous: null });

  if (rendered.current !== count) {
    setRendered({
      current: count,
      previous: animate ? rendered.current : null,
    });
  }

  const { current, previous } = rendered;

  return (
    <div
      className={cn(
        "grid place-items-center tabular-nums tracking-tight",
        "[&>*]:col-start-1 [&>*]:row-start-1",
        className,
      )}
    >
      <AnimatePresence initial={false}>
        {animate && previous !== null && previous !== current && (
          <motion.div
            key={`exit-${previous}-${current}`}
            aria-hidden
            initial={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            animate={{ opacity: 0, filter: "blur(2px)", y: -12 }}
            transition={{
              duration: ANIMATE_COUNT_DURATION_MS / 1000,
              ease: EASING,
            }}
            onAnimationComplete={() =>
              setRendered((r) => ({ current: r.current, previous: null }))
            }
          >
            {previous}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        key={`enter-${current}`}
        initial={animate ? { opacity: 0, filter: "blur(2px)", y: 8 } : false}
        animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
        transition={{
          duration: ANIMATE_COUNT_DURATION_MS / 1000,
          ease: EASING,
        }}
      >
        {current}
      </motion.div>
    </div>
  );
}
