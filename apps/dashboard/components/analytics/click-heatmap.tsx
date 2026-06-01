"use client";

import { useEffect, useMemo, useState } from "react";
import { MousePointerClick } from "lucide-react";
import type { HeatmapCell } from "@/lib/heatmap";
import { heatmapPathLabel } from "@/lib/heatmap";
import { cn } from "@/lib/utils";

interface ClickHeatmapProps {
  cells: HeatmapCell[];
  maxClicks: number;
}

const VIEWPORT_W = 1200;
const VIEWPORT_H = 800;

export default function ClickHeatmap({ cells, maxClicks }: ClickHeatmapProps) {
  const urls = useMemo(() => {
    const set = new Set<string>();
    for (const c of cells) set.add(c.url);
    return Array.from(set).slice(0, 12);
  }, [cells]);

  const [selectedUrl, setSelectedUrl] = useState("");

  useEffect(() => {
    if (!selectedUrl && urls.length > 0) {
      setSelectedUrl(urls[0]);
    }
  }, [urls, selectedUrl]);

  const filtered = useMemo(
    () => cells.filter((c) => c.url === selectedUrl),
    [cells, selectedUrl]
  );

  const peak = Math.max(1, maxClicks);

  if (cells.length === 0) {
    return (
      <p className="py-12 text-center text-muted-foreground text-sm">
        No click coordinates yet. Browse the demo store to generate interaction
        data.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {urls.length > 1 && (
        <div className="flex flex-wrap gap-1">
          {urls.map((url) => (
            <button
              key={url}
              type="button"
              onClick={() => setSelectedUrl(url)}
              className={cn(
                "max-w-full truncate rounded-md px-2 py-1 text-[10px] transition",
                selectedUrl === url
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              )}
              title={url}
            >
              {heatmapPathLabel(url)}
            </button>
          ))}
        </div>
      )}

      <div className="relative aspect-[3/2] w-full overflow-hidden rounded-lg border bg-muted/30">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {filtered.map((cell) => {
          const intensity = cell.clicks / peak;
          const size = 12 + intensity * 28;
          const left = (cell.x / VIEWPORT_W) * 100;
          const top = (cell.y / VIEWPORT_H) * 100;
          return (
            <div
              key={`${cell.x}-${cell.y}`}
              className="pointer-events-none absolute rounded-full"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: size,
                height: size,
                transform: "translate(-50%, -50%)",
                backgroundColor: `rgba(79, 70, 229, ${0.25 + intensity * 0.65})`,
                boxShadow: `0 0 ${8 + intensity * 16}px rgba(79, 70, 229, 0.45)`,
              }}
              title={`${cell.clicks} clicks`}
            />
          );
        })}
        <div className="absolute right-2 bottom-2 flex items-center gap-1 rounded-md border bg-background/90 px-2 py-1 text-[10px] text-muted-foreground">
          <MousePointerClick className="size-3" />
          {filtered.reduce((s, c) => s + c.clicks, 0)} clicks on page
        </div>
      </div>
      <p className="text-muted-foreground text-xs">
        Aggregated click positions (40px bins) from session interactions in
        ClickHouse. Select a URL to view its heatmap.
      </p>
    </div>
  );
}
