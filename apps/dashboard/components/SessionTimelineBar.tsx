"use client";

import { useCallback, useRef, useState } from "react";
import {
  ChevronDown,
  Gauge,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  Terminal,
} from "lucide-react";
import type { InactivitySegment } from "@/lib/inactivity-segments";
import {
  markerPercent,
  TIMELINE_MARKER_COLORS,
  type TimelineMarker,
} from "@/lib/session-markers";
import type { SessionPage } from "@/lib/session-pages";
import type { ReplayController } from "@/components/ReplayControls";
import { cn } from "@/lib/utils";

const SPEED_OPTIONS = [0.5, 1, 2, 4] as const;

interface SessionTimelineBarProps {
  controller: ReplayController | null;
  isPlaying: boolean;
  currentSpeed: number;
  currentTimeMs: number;
  totalDurationMs: number;
  sessionStartTimeMs: number;
  markers: TimelineMarker[];
  pages: SessionPage[];
  inactivitySegments: InactivitySegment[];
  onSeek: (timeMs: number) => void;
  onPlayStateChange: (playing: boolean) => void;
  onSpeedChange: (speed: number) => void;
}

function formatClock(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function SessionTimelineBar({
  controller,
  isPlaying,
  currentSpeed,
  currentTimeMs,
  totalDurationMs,
  sessionStartTimeMs,
  markers,
  pages,
  inactivitySegments,
  onSeek,
  onPlayStateChange,
  onSpeedChange,
}: SessionTimelineBarProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const disabled = !controller;

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

  const seekRelative = (deltaMs: number) => {
    onSeek(Math.min(totalDurationMs, Math.max(0, currentTimeMs + deltaMs)));
  };

  const handlePlayPause = () => {
    if (!controller) return;
    if (isPlaying) {
      controller.pause();
      onPlayStateChange(false);
    } else {
      controller.play();
      onPlayStateChange(true);
    }
  };

  return (
    <div className="session-timeline-bar rounded-xl border bg-card px-4 py-3 shadow-sm">
      <div className="relative mb-3 pt-2">
        <div
          ref={trackRef}
          role="slider"
          aria-label="Session timeline"
          aria-valuemin={0}
          aria-valuemax={totalDurationMs}
          aria-valuenow={currentTimeMs}
          className={cn(
            "session-timeline-rail relative mx-1 h-2 cursor-pointer rounded-full bg-muted",
            dragging && "ring-2 ring-primary/30"
          )}
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            setDragging(true);
            seekFromClientX(e.clientX);
          }}
          onPointerMove={(e) => dragging && seekFromClientX(e.clientX)}
          onPointerUp={(e) => {
            if (dragging) {
              setDragging(false);
              e.currentTarget.releasePointerCapture(e.pointerId);
            }
          }}
        >
          {inactivitySegments.map((seg, i) => (
            <span
              key={`inactive-${i}`}
              className="session-timeline-inactive absolute inset-y-0 rounded-full"
              style={{
                left: `${seg.startPercent}%`,
                width: `${seg.endPercent - seg.startPercent}%`,
              }}
            />
          ))}

          {pages.slice(1).map((page) => (
            <span
              key={page.id}
              className="pointer-events-none absolute top-0 bottom-0 w-px bg-border/80"
              style={{
                left: `${(page.startTimeMs / totalDurationMs) * 100}%`,
              }}
            />
          ))}

          <div
            className="absolute inset-y-0 left-0 rounded-full bg-primary/85"
            style={{ width: `${progressPercent}%` }}
          />

          {markers.map((marker, index) => {
            const left = markerPercent(
              marker.timestamp,
              sessionStartTimeMs,
              totalDurationMs
            );
            return (
              <span
                key={`tick-${marker.timestamp}-${index}`}
                className="session-timeline-event-tick pointer-events-none absolute bottom-full mb-0.5 w-0.5 rounded-full"
                style={{
                  left: `${left}%`,
                  height: marker.kind === "error" ? "14px" : "10px",
                  backgroundColor: TIMELINE_MARKER_COLORS[marker.kind],
                }}
              />
            );
          })}
        </div>

        <div
          className="session-timeline-playhead-knob pointer-events-none absolute top-0 size-3.5 -translate-x-1/2 rounded-full border-2 border-primary bg-background shadow-md"
          style={{ left: `calc(${progressPercent}% + 4px)` }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={disabled}
            aria-label={isPlaying ? "Pause" : "Play"}
            onClick={handlePlayPause}
            className="inline-flex size-9 items-center justify-center rounded-full border bg-background shadow-sm transition hover:bg-muted disabled:opacity-40"
          >
            {isPlaying ? (
              <Pause className="size-4 text-foreground" />
            ) : (
              <Play className="size-4 text-foreground" />
            )}
          </button>

          <div className="inline-flex items-center gap-1 rounded-md border bg-background px-2 py-1.5 text-xs tabular-nums shadow-sm">
            <span className="font-medium text-foreground">
              {formatClock(currentTimeMs)}
            </span>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground">
              {formatClock(totalDurationMs)}
            </span>
            <ChevronDown className="size-3 text-muted-foreground" />
          </div>

          <button
            type="button"
            disabled={disabled}
            className="rounded-md border bg-background px-2.5 py-1.5 text-xs font-medium shadow-sm hover:bg-muted disabled:opacity-40"
            onClick={() => seekRelative(-10_000)}
          >
            −10s
          </button>
          <button
            type="button"
            disabled={disabled}
            className="rounded-md border bg-background px-2.5 py-1.5 text-xs font-medium shadow-sm hover:bg-muted disabled:opacity-40"
            onClick={() => seekRelative(10_000)}
          >
            +10s
          </button>

          <div className="inline-flex overflow-hidden rounded-md border bg-background shadow-sm">
            {SPEED_OPTIONS.map((speed) => (
              <button
                key={speed}
                type="button"
                disabled={disabled}
                className={cn(
                  "px-2.5 py-1.5 text-xs font-semibold tabular-nums transition",
                  currentSpeed === speed
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                )}
                onClick={() => {
                  controller?.setSpeed(speed);
                  onSpeedChange(speed);
                }}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <ToolIcon label="Restart" onClick={() => controller?.goto(0)}>
            <RotateCcw className="size-3.5" />
          </ToolIcon>
          <ToolIcon label="Console logs">
            <Terminal className="size-3.5" />
          </ToolIcon>
          <ToolIcon label="Performance">
            <Gauge className="size-3.5" />
          </ToolIcon>
          <ToolIcon label="Fullscreen">
            <Maximize2 className="size-3.5" />
          </ToolIcon>
        </div>
      </div>
    </div>
  );
}

function ToolIcon({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="inline-flex size-8 items-center justify-center rounded-md border bg-background text-muted-foreground shadow-sm transition hover:bg-muted hover:text-foreground"
    >
      {children}
    </button>
  );
}
