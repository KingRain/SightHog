"use client";

import { useCallback, useRef, useState } from "react";
import {
  Keyboard,
  MousePointer2,
  Pause,
  Play,
  Rewind,
  RotateCcw,
  FastForward,
} from "lucide-react";
import type { InactivitySegment } from "@/lib/inactivity-segments";
import {
  markerPercent,
  TIMELINE_MARKER_COLORS,
  type TimelineMarker,
} from "@/lib/session-markers";
import type { SessionPage } from "@/lib/session-pages";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  setCurrentTimeMs,
  setHeatmapEnabled,
  setIsPlaying,
  setSpeed,
} from "@/store/replaySlice";
import { cn } from "@/lib/utils";
import { Kbd } from "@/components/unlumen/kbd";

const SPEED_OPTIONS = [0.5, 1, 2, 4] as const;

interface SessionTimelineBarProps {
  totalDurationMs: number;
  sessionStartTimeMs: number;
  markers: TimelineMarker[];
  pages: SessionPage[];
  inactivitySegments: InactivitySegment[];
  onSeek: (timeMs: number) => void;
}

function formatClock(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function SessionTimelineBar({
  totalDurationMs,
  sessionStartTimeMs,
  markers,
  pages,
  inactivitySegments,
  onSeek,
}: SessionTimelineBarProps) {
  const dispatch = useAppDispatch();
  const controller = useAppSelector((s) => s.replay.controller);
  const isPlaying = useAppSelector((s) => s.replay.isPlaying);
  const currentSpeed = useAppSelector((s) => s.replay.speed);
  const currentTimeMs = useAppSelector((s) => s.replay.currentTimeMs);
  const heatmapEnabled = useAppSelector((s) => s.replay.heatmapEnabled);
  const heatmapLoading = useAppSelector((s) => s.replay.heatmapLoading);

  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [hoverPercent, setHoverPercent] = useState<number | null>(null);
  const disabled = !controller;

  const progressPercent =
    totalDurationMs > 0
      ? Math.min(100, Math.max(0, (currentTimeMs / totalDurationMs) * 100))
      : 0;

  const seekFromClientX = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track || totalDurationMs <= 0) return;
      const rect = track.getBoundingClientRect();
      const ratio = Math.min(
        1,
        Math.max(0, (clientX - rect.left) / rect.width),
      );
      onSeek(ratio * totalDurationMs);
    },
    [onSeek, totalDurationMs],
  );

  const hoverFromClientX = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const ratio = Math.min(
      1,
      Math.max(0, (clientX - rect.left) / rect.width),
    );
    setHoverPercent(ratio * 100);
  }, []);

  const seekRelative = (deltaMs: number) => {
    onSeek(
      Math.min(totalDurationMs, Math.max(0, currentTimeMs + deltaMs)),
    );
  };

  const handlePlayPause = () => {
    if (!controller) return;
    controller.toggle();
  };

  const handleRestart = () => {
    onSeek(0);
    controller?.goto(0);
    controller?.pause();
    dispatch(setCurrentTimeMs(0));
    dispatch(setIsPlaying(false));
  };

  return (
    <div className="session-timeline-bar flex w-full flex-col gap-3">
      <div className="px-2 pt-3 pb-1">
        <div
          ref={trackRef}
          role="slider"
          aria-label="Session timeline"
          aria-valuemin={0}
          aria-valuemax={totalDurationMs}
          aria-valuenow={currentTimeMs}
          tabIndex={0}
          className={cn(
            "session-timeline-rail group relative h-2.5 w-full cursor-pointer rounded-full bg-muted transition-[height,box-shadow]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            (dragging || hoverPercent !== null) && "h-3 ring-2 ring-primary/20",
          )}
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            setDragging(true);
            seekFromClientX(e.clientX);
          }}
          onPointerMove={(e) => {
            hoverFromClientX(e.clientX);
            if (dragging) seekFromClientX(e.clientX);
          }}
          onPointerLeave={() => setHoverPercent(null)}
          onPointerUp={(e) => {
            if (dragging) {
              setDragging(false);
              e.currentTarget.releasePointerCapture(e.pointerId);
            }
          }}
        >
          {/* Inactive segments (hatched) */}
          {inactivitySegments.map((seg, i) => (
            <span
              key={`inactive-${i}`}
              className="session-timeline-inactive pointer-events-none absolute inset-y-0 rounded-full"
              style={{
                left: `${seg.startPercent}%`,
                width: `${seg.endPercent - seg.startPercent}%`,
              }}
            />
          ))}

          {/* Page boundary dividers */}
          {totalDurationMs > 0 &&
            pages.slice(1).map((page) => (
              <span
                key={page.id}
                className="pointer-events-none absolute inset-y-0 w-px bg-border"
                style={{
                  left: `${(page.startTimeMs / totalDurationMs) * 100}%`,
                }}
              />
            ))}

          {/* Filled progress */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary/80 to-primary"
            style={{ width: `${progressPercent}%` }}
          />

          {/* Hover preview line */}
          {hoverPercent !== null && !dragging && (
            <span
              className="pointer-events-none absolute inset-y-0 w-px bg-foreground/40"
              style={{ left: `${hoverPercent}%` }}
            />
          )}

          {/* Event tick markers */}
          {markers.map((marker, index) => {
            const left = markerPercent(
              marker.timestamp,
              sessionStartTimeMs,
              totalDurationMs,
            );
            return (
              <span
                key={`tick-${marker.timestamp}-${index}`}
                className="session-timeline-event-tick pointer-events-none absolute top-1/2 rounded-full"
                style={{
                  left: `${left}%`,
                  width: "2px",
                  height: marker.kind === "error" ? "14px" : "9px",
                  backgroundColor: TIMELINE_MARKER_COLORS[marker.kind],
                  transform: "translate(-50%, -50%)",
                }}
                title={marker.label}
              />
            );
          })}

          {/* Playhead knob */}
          <div
            className={cn(
              "session-timeline-playhead-knob pointer-events-none absolute top-1/2 z-10 size-4 rounded-full border-2 border-primary bg-background shadow-md",
              dragging && "scale-110",
            )}
            style={{
              left: `${progressPercent}%`,
              transform: "translate(-50%, -50%)",
            }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 px-1">
        <div className="flex items-center gap-1 rounded-lg border bg-background p-1 shadow-sm">
          <ControlIconButton
            onClick={handleRestart}
            disabled={disabled}
            label="Restart"
          >
            <RotateCcw className="size-3.5" />
          </ControlIconButton>
          <ControlIconButton
            onClick={() => seekRelative(-10_000)}
            disabled={disabled}
            label="Back 10 seconds"
          >
            <Rewind className="size-3.5" />
          </ControlIconButton>
          <button
            type="button"
            disabled={disabled}
            aria-label={isPlaying ? "Pause" : "Play"}
            title={isPlaying ? "Pause" : "Play"}
            onClick={handlePlayPause}
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-md text-primary-foreground transition",
              "bg-primary hover:bg-primary/90",
              "disabled:cursor-not-allowed disabled:opacity-40",
            )}
          >
            {isPlaying ? (
              <Pause className="size-4" />
            ) : (
              <Play className="size-4 translate-x-px" />
            )}
          </button>
          <ControlIconButton
            onClick={() => seekRelative(10_000)}
            disabled={disabled}
            label="Forward 10 seconds"
          >
            <FastForward className="size-3.5" />
          </ControlIconButton>
        </div>

        <div className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-background px-3 text-xs tabular-nums shadow-sm">
          <span className="font-semibold text-foreground">
            {formatClock(currentTimeMs)}
          </span>
          <span className="text-border">/</span>
          <span className="text-muted-foreground">
            {formatClock(totalDurationMs)}
          </span>
        </div>

        <button
          type="button"
          disabled={disabled || heatmapLoading}
          aria-pressed={heatmapEnabled}
          aria-label={
            heatmapEnabled ? "Hide click heatmap" : "Show click heatmap"
          }
          title={heatmapEnabled ? "Hide heatmap" : "Show heatmap"}
          onClick={() => dispatch(setHeatmapEnabled(!heatmapEnabled))}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium shadow-sm transition disabled:cursor-not-allowed disabled:opacity-40",
            heatmapEnabled
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-foreground hover:bg-muted",
          )}
        >
          <MousePointer2 className="size-3.5" />
          Heatmap
        </button>

        <div
          role="group"
          aria-label="Playback speed"
          className="inline-flex h-9 items-stretch overflow-hidden rounded-lg border bg-background shadow-sm"
        >
          {SPEED_OPTIONS.map((speed) => (
            <button
              key={speed}
              type="button"
              disabled={disabled}
              aria-pressed={currentSpeed === speed}
              className={cn(
                "min-w-[2.5rem] px-2.5 text-xs font-semibold tabular-nums transition",
                "disabled:cursor-not-allowed disabled:opacity-40",
                currentSpeed === speed
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              onClick={() => {
                controller?.setSpeed(speed);
                dispatch(setSpeed(speed));
              }}
            >
              {speed}x
            </button>
          ))}
        </div>

        <div className="ml-auto hidden items-center gap-2 text-[11px] text-muted-foreground sm:flex">
          <Keyboard className="size-3.5" aria-hidden />
          <span className="inline-flex items-center gap-1">
            <Kbd size="sm">Space</Kbd>
            <span className="opacity-60">play</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Kbd size="sm">←</Kbd>
            <Kbd size="sm">→</Kbd>
            <span className="opacity-60">seek</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Kbd size="sm">,</Kbd>
            <Kbd size="sm">.</Kbd>
            <span className="opacity-60">speed</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function ControlIconButton({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition",
        "hover:bg-muted hover:text-foreground",
        "disabled:cursor-not-allowed disabled:opacity-40",
      )}
    >
      {children}
    </button>
  );
}
