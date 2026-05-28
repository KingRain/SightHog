"use client";

import { useEffect, useRef } from "react";
import type { ReplayController } from "@/components/ReplayControls";

const SPEED_OPTIONS = [0.5, 1, 2, 4] as const;

function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

export interface UseReplayKeyboardOptions {
  controller: ReplayController | null;
  isPlaying: boolean;
  currentTimeMs: number;
  currentSpeed: number;
  totalDurationMs: number;
  onSeek: (timeMs: number) => void;
  onPlayStateChange: (playing: boolean) => void;
  onSpeedChange: (speed: number) => void;
  enabled?: boolean;
}

export function useReplayKeyboard({
  controller,
  isPlaying,
  currentTimeMs,
  currentSpeed,
  totalDurationMs,
  onSeek,
  onPlayStateChange,
  onSpeedChange,
  enabled = true,
}: UseReplayKeyboardOptions): void {
  const timeRef = useRef(currentTimeMs);
  const playingRef = useRef(isPlaying);
  const speedRef = useRef(currentSpeed);

  timeRef.current = currentTimeMs;
  playingRef.current = isPlaying;
  speedRef.current = currentSpeed;

  useEffect(() => {
    if (!enabled || !controller) return;

    const seekTo = (ms: number) => {
      const clamped = Math.max(0, Math.min(totalDurationMs, ms));
      controller.goto(clamped);
      onSeek(clamped);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;

      const shift = event.shiftKey;
      const step = shift ? 10_000 : 5_000;

      switch (event.key) {
        case " ":
          event.preventDefault();
          controller.toggle();
          onPlayStateChange(!playingRef.current);
          break;
        case "ArrowLeft":
          event.preventDefault();
          seekTo(timeRef.current - step);
          break;
        case "ArrowRight":
          event.preventDefault();
          seekTo(timeRef.current + step);
          break;
        case "Home":
          event.preventDefault();
          seekTo(0);
          break;
        case "End":
          event.preventDefault();
          seekTo(totalDurationMs);
          break;
        case ",":
        case "<": {
          event.preventDefault();
          const idx = SPEED_OPTIONS.indexOf(
            speedRef.current as (typeof SPEED_OPTIONS)[number],
          );
          const nextIdx = Math.max(0, idx <= 0 ? 0 : idx - 1);
          const speed = SPEED_OPTIONS[nextIdx] ?? 0.5;
          controller.setSpeed(speed);
          onSpeedChange(speed);
          break;
        }
        case ".":
        case ">": {
          event.preventDefault();
          const idx = SPEED_OPTIONS.indexOf(
            speedRef.current as (typeof SPEED_OPTIONS)[number],
          );
          const nextIdx = Math.min(
            SPEED_OPTIONS.length - 1,
            idx < 0 ? 1 : idx + 1,
          );
          const speed = SPEED_OPTIONS[nextIdx] ?? 1;
          controller.setSpeed(speed);
          onSpeedChange(speed);
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    controller,
    enabled,
    totalDurationMs,
    onSeek,
    onPlayStateChange,
    onSpeedChange,
  ]);
}
