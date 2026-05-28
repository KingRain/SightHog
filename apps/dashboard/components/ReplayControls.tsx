"use client";

import {
  FastForward,
  Gauge,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SPEED_OPTIONS = [0.5, 1, 2, 4] as const;

export interface ReplayController {
  play: () => void;
  pause: () => void;
  toggle: () => void;
  goto: (timeMs: number) => void;
  setSpeed: (speed: number) => void;
  toggleSkipInactive: () => void;
}

interface ReplayControlsProps {
  controller: ReplayController | null;
  isPlaying: boolean;
  currentSpeed: number;
  skipInactive: boolean;
  onPlayStateChange: (playing: boolean) => void;
  onSpeedChange: (speed: number) => void;
  onSkipInactiveChange: (active: boolean) => void;
}

export default function ReplayControls({
  controller,
  isPlaying,
  currentSpeed,
  skipInactive,
  onPlayStateChange,
  onSpeedChange,
  onSkipInactiveChange,
}: ReplayControlsProps) {
  const disabled = !controller;

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

  const handleRestart = () => {
    if (!controller) return;
    controller.goto(0);
    controller.pause();
    onPlayStateChange(false);
  };

  const handleSpeed = (speed: number) => {
    if (!controller) return;
    controller.setSpeed(speed);
    onSpeedChange(speed);
  };

  const handleSkipInactive = () => {
    if (!controller) return;
    controller.toggleSkipInactive();
    onSkipInactiveChange(!skipInactive);
  };

  return (
    <div className="replay-controls-bar flex flex-wrap items-center justify-between gap-3 border-t border-border/80 px-4 py-2.5">
      <div className="flex items-center gap-1.5">
        <IconButton
          label={isPlaying ? "Pause" : "Play"}
          disabled={disabled}
          onClick={handlePlayPause}
          active={isPlaying}
        >
          {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
        </IconButton>
        <IconButton
          label="Restart from beginning"
          disabled={disabled}
          onClick={handleRestart}
        >
          <RotateCcw className="size-4" />
        </IconButton>
        <IconButton
          label={skipInactive ? "Skip inactive: on" : "Skip inactive: off"}
          disabled={disabled}
          onClick={handleSkipInactive}
          active={skipInactive}
        >
          <SkipForward className="size-4" />
        </IconButton>
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-white/60 sm:inline-flex">
          <Gauge className="size-3.5 text-white" aria-hidden />
          Speed
        </span>
        <div className="replay-speed-segment inline-flex items-center overflow-hidden rounded-md border border-white/15 bg-white/5">
          {SPEED_OPTIONS.map((speed) => (
            <button
              key={speed}
              type="button"
              disabled={disabled}
              aria-label={`${speed}x playback speed`}
              aria-pressed={currentSpeed === speed}
              className={cn(
                "min-w-[2.5rem] px-2 py-1.5 text-[11px] font-semibold tabular-nums transition",
                "text-white/80 hover:bg-white/10 disabled:opacity-40",
                currentSpeed === speed &&
                  "bg-primary text-white shadow-sm"
              )}
              onClick={() => handleSpeed(speed)}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      <div className="hidden items-center gap-1 text-[10px] text-white/50 lg:flex">
        <FastForward className="size-3 text-white/70" aria-hidden />
        <span>Skip inactive jumps dead air</span>
      </div>
    </div>
  );
}

function IconButton({
  children,
  label,
  disabled,
  onClick,
  active,
}: {
  children: React.ReactNode;
  label: string;
  disabled?: boolean;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-md border border-white/15 transition",
        "text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40",
        active && "border-primary/50 bg-primary/25 ring-1 ring-primary/40"
      )}
    >
      {children}
    </button>
  );
}
