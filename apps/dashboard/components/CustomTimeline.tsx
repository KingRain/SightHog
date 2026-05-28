"use client";

import { useCallback, useRef, useState } from "react";
import {
  markerPercent,
  TIMELINE_MARKER_COLORS,
  type TimelineMarker,
} from "@/lib/session-markers";
import { cn } from "@/lib/utils";

interface CustomTimelineProps {
  currentTimeMs: number;
  totalDurationMs: number;
  sessionStartTimeMs: number;
  markers: TimelineMarker[];
  onSeek: (timeMs: number) => void;
}

function formatClock(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function CustomTimeline({
  currentTimeMs,
  totalDurationMs,
  sessionStartTimeMs,
  markers,
  onSeek,
}: CustomTimelineProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [hoveredMarker, setHoveredMarker] = useState<TimelineMarker | null>(null);

  const progressPercent =
    totalDurationMs > 0
      ? Math.min(100, (currentTimeMs / totalDurationMs) * 100)
      : 0;

  const seekFromClientX = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track || totalDurationMs <= 0) return;
      const rect = track.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      onSeek(ratio * totalDurationMs);
    },
    [onSeek, totalDurationMs]
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    seekFromClientX(event.clientX);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    seekFromClientX(event.clientX);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragging) {
      setDragging(false);
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const errorMarkers = markers.filter((m) => m.kind === "error");

  return (
    <div className="replay-custom-timeline space-y-2 px-4 pb-3 pt-2">
      <div
        ref={trackRef}
        role="slider"
        aria-label="Session timeline"
        aria-valuemin={0}
        aria-valuemax={totalDurationMs}
        aria-valuenow={currentTimeMs}
        className={cn(
          "replay-timeline-track relative h-3 w-full cursor-pointer rounded-full border border-border/80 bg-input shadow-inner",
          dragging && "ring-2 ring-primary/40"
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {errorMarkers.length > 0 && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
            {errorMarkers.map((marker, index) => {
              const left = markerPercent(
                marker.timestamp,
                sessionStartTimeMs,
                totalDurationMs
              );
              return (
                <span
                  key={`err-span-${marker.timestamp}-${index}`}
                  className="absolute top-0 bottom-0 w-1 -translate-x-1/2 rounded-full bg-destructive/25"
                  style={{ left: `${left}%` }}
                />
              );
            })}
          </div>
        )}

        <div
          className="replay-timeline-progress absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary/70 to-primary"
          style={{ width: `${progressPercent}%` }}
        />

        <div
          className="replay-timeline-playhead pointer-events-none absolute top-1/2 z-10 w-0.5 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]"
          style={{ left: `${progressPercent}%` }}
        />

        <div
          className={cn(
            "replay-timeline-handle pointer-events-none absolute top-1/2 z-20 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-white shadow-md transition-transform",
            dragging && "scale-110"
          )}
          style={{ left: `${progressPercent}%` }}
        />

        {markers.map((marker, index) => {
          const left = markerPercent(
            marker.timestamp,
            sessionStartTimeMs,
            totalDurationMs
          );
          const isHovered = hoveredMarker === marker;
          return (
            <button
              key={`${marker.timestamp}-${marker.kind}-${index}`}
              type="button"
              className={cn(
                "replay-timeline-marker absolute top-1/2 z-[5] size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                `replay-timeline-marker--${marker.kind}`,
                isHovered && "z-[6] scale-150 shadow-lg"
              )}
              style={{
                left: `${left}%`,
                backgroundColor: TIMELINE_MARKER_COLORS[marker.kind],
                boxShadow: isHovered
                  ? `0 0 0 3px color-mix(in srgb, ${TIMELINE_MARKER_COLORS[marker.kind]} 35%, transparent)`
                  : undefined,
              }}
              title={marker.label}
              aria-label={marker.label}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onSeek(marker.timestamp - sessionStartTimeMs);
              }}
              onMouseEnter={() => setHoveredMarker(marker)}
              onMouseLeave={() => setHoveredMarker(null)}
              onFocus={() => setHoveredMarker(marker)}
              onBlur={() => setHoveredMarker(null)}
            />
          );
        })}
      </div>

      <div className="flex items-center justify-between text-[10px] tabular-nums text-white/70">
        <span>{formatClock(currentTimeMs)}</span>
        {hoveredMarker && (
          <span className="max-w-[55%] truncate text-center text-white/90">
            {hoveredMarker.label}
          </span>
        )}
        <span>{formatClock(totalDurationMs)}</span>
      </div>
    </div>
  );
}
