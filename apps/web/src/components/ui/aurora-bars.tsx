"use client";

import * as React from "react";
import { useAnimationFrame } from "motion/react";

import { cn } from "@/lib/utils";

export interface AuroraBarsProps {
  /** @default 36 */
  barCount?: number;
  /** gradient color stops, bottom to top */
  colors?: string[];
  /** @default 0.92 */
  maxHeightRatio?: number;
  /** @default 0.18 */
  minHeightRatio?: number;
  /** @default 0.5 */
  speed?: number;
  /** @default 4 */
  gap?: number;
  /** px blur per bar, creates soft glow */
  blur?: number;
  /** @default "#000000" */
  background?: string;
  className?: string;
}

function barHeight(
  index: number,
  total: number,
  time: number,
  minH: number,
  maxH: number,
): number {
  const norm = index / (total - 1);
  const arch = Math.sin(norm * Math.PI);

  const phase1 = (index / total) * Math.PI * 2;
  const phase2 = (index / total) * Math.PI * 5.3;

  const wave =
    0.5 +
    0.25 * Math.sin(time * 1.1 + phase1) +
    0.25 * Math.sin(time * 0.7 + phase2);

  const blended = arch * 0.65 + wave * 0.35;

  return minH + blended * (maxH - minH);
}

export function AuroraBars({
  barCount = 36,
  colors = [
    "#1a0808",
    "#3a0d05",
    "#7a1f08",
    "#c83a10",
    "#ff5a1f",
    "#ff8a4c",
    "#00000000",
  ],
  maxHeightRatio = 0.92,
  minHeightRatio = 0.18,
  speed = 0.5,
  gap = 4,
  blur = 14,
  background = "transparent",
  className,
}: AuroraBarsProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [heights, setHeights] = React.useState<number[]>(() =>
    Array.from({ length: barCount }, (_, i) =>
      barHeight(i, barCount, 0, minHeightRatio, maxHeightRatio),
    ),
  );

  const timeRef = React.useRef(0);

  useAnimationFrame((_, delta) => {
    timeRef.current += (delta / 1000) * speed;
    const t = timeRef.current;
    setHeights(
      Array.from({ length: barCount }, (_, i) =>
        barHeight(i, barCount, t, minHeightRatio, maxHeightRatio),
      ),
    );
  });

  const gradientStop = colors
    .map((c, i) => `${c} ${Math.round((i / (colors.length - 1)) * 100)}%`)
    .join(", ");
  const gradient = `linear-gradient(to top, ${gradientStop})`;

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full h-full overflow-hidden", className)}
      style={{ background }}
    >
      <div className="absolute inset-0 flex items-end">
        {Array.from({ length: barCount }).map((_, i) => {
          const heightFraction = heights[i] ?? maxHeightRatio;
          return (
            <div
              key={i}
              className="flex-1"
              style={{
                height: "100%",
                display: "flex",
                alignItems: "flex-end",
                padding: `0 ${gap / 2}px`,
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: `${heightFraction * 100}%`,
                  background: gradient,
                  borderRadius: "9999px 9999px 0 0",
                  filter: `blur(${blur}px)`,
                  opacity: 0.85,
                }}
              />
            </div>
          );
        })}
      </div>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 90% 80% at 50% 100%, transparent 30%, #0a0a0bcc 100%)",
        }}
      />
    </div>
  );
}
