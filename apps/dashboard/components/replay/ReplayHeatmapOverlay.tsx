"use client";

import { useEffect, useState, type RefObject } from "react";
import type { HeatmapCell } from "@/lib/heatmap";

interface ReplayHeatmapOverlayProps {
  hostRef: RefObject<HTMLDivElement | null>;
  cells: HeatmapCell[];
  maxClicks: number;
  viewportWidth: number;
  viewportHeight: number;
  active: boolean;
}

interface OverlayRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export default function ReplayHeatmapOverlay({
  hostRef,
  cells,
  maxClicks,
  viewportWidth,
  viewportHeight,
  active,
}: ReplayHeatmapOverlayProps) {
  const [rect, setRect] = useState<OverlayRect | null>(null);

  useEffect(() => {
    if (!active) {
      setRect(null);
      return;
    }

    const host = hostRef.current;
    if (!host) return;

    const measure = () => {
      const anchor = host.parentElement ?? host;
      const wrapper = host.querySelector(".replayer-wrapper") as HTMLElement | null;
      if (!wrapper) {
        setRect(null);
        return;
      }
      const anchorBox = anchor.getBoundingClientRect();
      const wrapBox = wrapper.getBoundingClientRect();
      setRect({
        top: wrapBox.top - anchorBox.top,
        left: wrapBox.left - anchorBox.left,
        width: wrapBox.width,
        height: wrapBox.height,
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    const wrapper = host.querySelector(".replayer-wrapper");
    if (wrapper) observer.observe(wrapper);

    const mo = new MutationObserver(measure);
    mo.observe(host, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mo.disconnect();
    };
  }, [active, hostRef, cells.length]);

  if (!active || !rect || cells.length === 0) {
    return null;
  }

  const peak = Math.max(1, maxClicks);
  const vw = Math.max(1, viewportWidth);
  const vh = Math.max(1, viewportHeight);

  return (
    <div
      className="pointer-events-none absolute z-20 overflow-hidden"
      style={{
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      }}
      aria-hidden
    >
      {cells.map((cell) => {
        const intensity = cell.clicks / peak;
        const size = 10 + intensity * 24;
        const left = (cell.x / vw) * 100;
        const top = (cell.y / vh) * 100;
        return (
          <div
            key={`${cell.x}-${cell.y}-${cell.url}`}
            className="absolute rounded-full"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: size,
              height: size,
              transform: "translate(-50%, -50%)",
              backgroundColor: `rgba(79, 70, 229, ${0.3 + intensity * 0.6})`,
              boxShadow: `0 0 ${6 + intensity * 14}px rgba(79, 70, 229, 0.5)`,
            }}
            title={`${cell.clicks} click${cell.clicks === 1 ? "" : "s"}`}
          />
        );
      })}
    </div>
  );
}
