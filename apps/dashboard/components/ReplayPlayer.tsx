"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Film } from "lucide-react";
import rrwebPlayer from "rrweb-player";
import "rrweb-player/dist/style.css";
import CustomTimeline from "@/components/CustomTimeline";
import ReplayControls, {
  type ReplayController,
} from "@/components/ReplayControls";
import { type TimelineMarker } from "@/lib/session-markers";
import {
  getSessionDurationMs,
  getSessionStartTimeMs,
  hasFullSnapshot,
  prepareReplayEvents,
} from "@/lib/replay";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

interface ReplayPlayerProps {
  events: unknown[];
  timelineMarkers?: TimelineMarker[];
  chrome?: "internal" | "external";
  currentVideoTimeMs?: number;
  onTimeUpdate?: (timeMs: number) => void;
  onSessionStartTime?: (startTimeMs: number) => void;
  onDurationChange?: (durationMs: number) => void;
  registerSeek?: (seek: (timeMs: number) => void) => void;
  onControllerReady?: (controller: ReplayController | null) => void;
  onPlayStateChange?: (playing: boolean) => void;
  onSpeedChange?: (speed: number) => void;
}

function resolveTimePayload(payload: unknown): number {
  if (typeof payload === "number" && Number.isFinite(payload)) {
    return payload;
  }
  if (payload && typeof payload === "object" && "payload" in payload) {
    const inner = (payload as { payload: unknown }).payload;
    if (typeof inner === "number" && Number.isFinite(inner)) {
      return inner;
    }
  }
  return 0;
}

export default function ReplayPlayer({
  events,
  timelineMarkers = [],
  chrome = "internal",
  currentVideoTimeMs: externalTimeMs,
  onTimeUpdate,
  onSessionStartTime,
  onDurationChange,
  registerSeek,
  onControllerReady,
  onPlayStateChange,
  onSpeedChange,
}: ReplayPlayerProps) {
  const externalChrome = chrome === "external";
  const playerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<InstanceType<typeof rrwebPlayer> | null>(
    null
  );
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const rafRef = useRef<number | null>(null);
  const [containerWidth, setContainerWidth] = useState(960);
  const [internalTimeMs, setInternalTimeMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(1);
  const [skipInactive, setSkipInactive] = useState(false);
  const [controller, setController] = useState<ReplayController | null>(null);

  const currentTimeMs = externalTimeMs ?? internalTimeMs;

  const baseEvents = useMemo(() => prepareReplayEvents(events), [events]);

  const replayReady =
    baseEvents.length > 0 && hasFullSnapshot(baseEvents);

  const sessionStartTimeMs = useMemo(
    () => getSessionStartTimeMs(baseEvents),
    [baseEvents]
  );

  const totalDurationMs = useMemo(
    () => getSessionDurationMs(baseEvents),
    [baseEvents]
  );

  const eventsKey = useMemo(
    () =>
      `${baseEvents.length}:${sessionStartTimeMs}:${timelineMarkers.length}`,
    [baseEvents.length, sessionStartTimeMs, timelineMarkers.length]
  );

  const playerHeight = Math.max(Math.round(containerWidth * (9 / 16)), 360);

  useEffect(() => {
    onTimeUpdateRef.current = onTimeUpdate;
  }, [onTimeUpdate]);

  useEffect(() => {
    if (sessionStartTimeMs > 0) {
      onSessionStartTime?.(sessionStartTimeMs);
    }
  }, [sessionStartTimeMs, onSessionStartTime]);

  useEffect(() => {
    onDurationChange?.(totalDurationMs);
  }, [totalDurationMs, onDurationChange]);

  useEffect(() => {
    const container = playerRef.current;
    if (!container) {
      return;
    }

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (!width || width <= 0) {
        return;
      }
      const nextWidth = Math.min(Math.floor(width), 1024);
      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }
      resizeTimer = setTimeout(() => {
        setContainerWidth((prev) =>
          Math.abs(prev - nextWidth) > 24 ? nextWidth : prev
        );
      }, 200);
    });

    observer.observe(container);
    return () => {
      observer.disconnect();
      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }
    };
  }, []);

  useEffect(() => {
    const container = playerRef.current;
    if (!container || !replayReady) {
      return;
    }

    playerInstanceRef.current?.$destroy?.();
    playerInstanceRef.current = null;
    setController(null);
    container.innerHTML = "";

    const width = container.clientWidth > 0 ? container.clientWidth : containerWidth;
    const height = Math.max(Math.round(width * (9 / 16)), 360);

    const player = new rrwebPlayer({
      target: container,
      props: {
        events: baseEvents as never[],
        width: Math.min(Math.floor(width), 1024),
        height,
        autoPlay: false,
        showController: false,
        inactiveColor:
          "color-mix(in srgb, var(--muted-foreground) 35%, transparent)",
        speedOption: [0.5, 1, 2, 4],
      },
    });

    playerInstanceRef.current = player;

    const replayController: ReplayController = {
      play: () => player.play(),
      pause: () => player.pause(),
      toggle: () => player.toggle(),
      goto: (timeMs: number) => player.goto(timeMs, true),
      setSpeed: (speed: number) => player.setSpeed(speed),
      toggleSkipInactive: () => player.toggleSkipInactive(),
    };
    setController(replayController);
    onControllerReady?.(replayController);
    setIsPlaying(false);
    setCurrentSpeed(1);
    setSkipInactive(false);
    onPlayStateChange?.(false);
    onSpeedChange?.(1);

    registerSeek?.((timeMs: number) => player.goto(timeMs, true));

    const emitTime = (timeMs: number) => {
      setInternalTimeMs(timeMs);
      onTimeUpdateRef.current?.(timeMs);
    };

    const handleTimeUpdate = (payload: unknown) => {
      emitTime(resolveTimePayload(payload));
    };

    player.addEventListener("ui-update-current-time", handleTimeUpdate);
    emitTime(0);

    const replayer = player.getReplayer();
    const pollTime = () => {
      if (playerInstanceRef.current !== player) {
        return;
      }
      try {
        const current = replayer.getCurrentTime();
        if (typeof current === "number") {
          emitTime(current);
        }
      } catch {
        // Player may be mid-teardown.
      }
      rafRef.current = requestAnimationFrame(pollTime);
    };
    rafRef.current = requestAnimationFrame(pollTime);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (playerInstanceRef.current === player) {
        player.$destroy?.();
        playerInstanceRef.current = null;
      }
      setController(null);
      onControllerReady?.(null);
      container.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventsKey, replayReady]);

  useEffect(() => {
    playerInstanceRef.current?.triggerResize?.();
  }, [containerWidth, playerHeight]);

  const handleSeek = useCallback((timeMs: number) => {
    playerInstanceRef.current?.goto(timeMs, true);
    setInternalTimeMs(timeMs);
    onTimeUpdateRef.current?.(timeMs);
  }, []);

  const activeTags = useMemo(() => {
    const tags = new Set(timelineMarkers.map((marker) => marker.tag));
    return Array.from(tags);
  }, [timelineMarkers]);

  if (baseEvents.length === 0) {
    return (
      <Empty className="rounded-2xl border bg-card py-12">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Film />
          </EmptyMedia>
          <EmptyTitle>No replay events</EmptyTitle>
          <EmptyDescription>
            This session does not have a stored replay yet. Wait ~30 seconds after
            generating telemetry, then try again.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (!replayReady) {
    return (
      <Empty className="rounded-2xl border bg-card py-12">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Film />
          </EmptyMedia>
          <EmptyTitle>Replay is incomplete</EmptyTitle>
          <EmptyDescription>
            This session is missing the initial DOM snapshot required by rrweb.
            Interact with the demo checkout again and wait for the blob worker to
            flush (~30s), then refresh and retry.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div
      className={
        externalChrome
          ? "replay-shell-embedded relative w-full overflow-hidden bg-background"
          : "replay-shell relative w-full overflow-hidden rounded-2xl border bg-card"
      }
    >
      <div
        ref={playerRef}
        className="replay-player-host mx-auto w-full [&_.rr-player]:mx-auto [&_.rr-player]:max-w-full [&_.rr-controller]:hidden"
      />
      {!externalChrome && (
        <div className="replay-chrome border-t border-border/80 bg-[color-mix(in_srgb,var(--card)_82%,var(--foreground))]">
          <ReplayControls
            controller={controller}
            isPlaying={isPlaying}
            currentSpeed={currentSpeed}
            skipInactive={skipInactive}
            onPlayStateChange={(playing) => {
              setIsPlaying(playing);
              onPlayStateChange?.(playing);
            }}
            onSpeedChange={(speed) => {
              setCurrentSpeed(speed);
              onSpeedChange?.(speed);
            }}
            onSkipInactiveChange={setSkipInactive}
          />
          <CustomTimeline
            currentTimeMs={currentTimeMs}
            totalDurationMs={totalDurationMs}
            sessionStartTimeMs={sessionStartTimeMs}
            markers={timelineMarkers}
            onSeek={handleSeek}
          />
        </div>
      )}
      {!externalChrome && activeTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t bg-muted/30 px-4 py-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Markers
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="size-2 rounded-full bg-destructive" /> Error
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="size-2 rounded-full bg-amber-400" /> Slow (&gt;800ms)
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="size-2 rounded-full bg-sky-400" /> User action
          </span>
        </div>
      )}
    </div>
  );
}
