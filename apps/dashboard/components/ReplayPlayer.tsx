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
  createReplayController,
  fitReplayerToViewport,
} from "@/lib/replay-controller";
import {
  getSessionDurationMs,
  getSessionStartTimeMs,
  hasFullSnapshot,
  prepareReplayEvents,
} from "@/lib/replay";
import ReplayHeatmapOverlay from "@/components/replay/ReplayHeatmapOverlay";
import type { HeatmapCell } from "@/lib/heatmap";
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
  heatmapEnabled?: boolean;
  heatmapCells?: HeatmapCell[];
  heatmapMaxClicks?: number;
  heatmapViewportWidth?: number;
  heatmapViewportHeight?: number;
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
  heatmapEnabled = false,
  heatmapCells = [],
  heatmapMaxClicks = 0,
  heatmapViewportWidth = 1280,
  heatmapViewportHeight = 720,
}: ReplayPlayerProps) {
  const externalChrome = chrome === "external";
  const viewportRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<InstanceType<typeof rrwebPlayer> | null>(
    null
  );
  const controllerRef = useRef<ReplayController | null>(null);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const onPlayStateChangeRef = useRef(onPlayStateChange);
  const onSpeedChangeRef = useRef(onSpeedChange);
  const rafRef = useRef<number | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 960, height: 540 });
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

  const wallClockDurationMs = useMemo(
    () => getSessionDurationMs(baseEvents),
    [baseEvents]
  );

  const eventsKey = useMemo(
    () =>
      `${baseEvents.length}:${sessionStartTimeMs}:${timelineMarkers.length}`,
    [baseEvents.length, sessionStartTimeMs, timelineMarkers.length]
  );

  useEffect(() => {
    onTimeUpdateRef.current = onTimeUpdate;
  }, [onTimeUpdate]);

  useEffect(() => {
    onPlayStateChangeRef.current = onPlayStateChange;
  }, [onPlayStateChange]);

  useEffect(() => {
    onSpeedChangeRef.current = onSpeedChange;
  }, [onSpeedChange]);

  useEffect(() => {
    if (sessionStartTimeMs > 0) {
      onSessionStartTime?.(sessionStartTimeMs);
    }
  }, [sessionStartTimeMs, onSessionStartTime]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;

    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect || rect.width <= 0 || rect.height <= 0) {
        return;
      }
      const next = {
        width: Math.floor(rect.width),
        height: Math.floor(rect.height),
      };
      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }
      resizeTimer = setTimeout(() => {
        setContainerSize((prev) => {
          const widthChanged = Math.abs(prev.width - next.width) > 4;
          const heightChanged = Math.abs(prev.height - next.height) > 4;
          return widthChanged || heightChanged ? next : prev;
        });
      }, 100);
    });

    observer.observe(viewport);
    return () => {
      observer.disconnect();
      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }
    };
  }, [replayReady]);

  useEffect(() => {
    const container = playerRef.current;
    if (!container || !replayReady) {
      return;
    }

    playerInstanceRef.current?.$destroy?.();
    playerInstanceRef.current = null;
    controllerRef.current = null;
    setController(null);
    container.innerHTML = "";

    const viewportEl = viewportRef.current;
    const width =
      viewportEl && viewportEl.clientWidth > 0
        ? viewportEl.clientWidth
        : containerSize.width;
    const height =
      viewportEl && viewportEl.clientHeight > 0
        ? viewportEl.clientHeight
        : containerSize.height;

    const player = new rrwebPlayer({
      target: container,
      props: {
        events: baseEvents as never[],
        width,
        height,
        maxScale: 0,
        speed: 1,
        autoPlay: false,
        skipInactive: false,
        showController: false,
        inactiveColor:
          "color-mix(in srgb, var(--muted-foreground) 35%, transparent)",
        speedOption: [0.5, 1, 2, 4],
      },
    });

    playerInstanceRef.current = player;
    const replayer = player.getReplayer();

    const replayController = createReplayController(player);
    controllerRef.current = replayController;
    setController(replayController);
    onControllerReady?.(replayController);

    setIsPlaying(false);
    setCurrentSpeed(1);
    setSkipInactive(false);
    onPlayStateChangeRef.current?.(false);
    onSpeedChangeRef.current?.(1);

    registerSeek?.((timeMs: number) => replayController.goto(timeMs));

    const emitTime = (timeMs: number) => {
      setInternalTimeMs(timeMs);
      onTimeUpdateRef.current?.(timeMs);
    };

    const handleTimeUpdate = (payload: unknown) => {
      emitTime(resolveTimePayload(payload));
    };

    player.addEventListener("ui-update-current-time", handleTimeUpdate);

    const syncViewport = () => {
      fitReplayerToViewport(container, width, height);
    };

    player.addEventListener("resize", syncViewport);
    replayer.on("resize", syncViewport);
    replayer.on("start", () => {
      setIsPlaying(true);
      onPlayStateChangeRef.current?.(true);
    });
    replayer.on("pause", () => {
      setIsPlaying(false);
      onPlayStateChangeRef.current?.(false);
    });
    replayer.on("finish", () => {
      setIsPlaying(false);
      onPlayStateChangeRef.current?.(false);
    });

    requestAnimationFrame(syncViewport);
    setTimeout(syncViewport, 50);
    setTimeout(syncViewport, 250);

    let replayDurationMs = wallClockDurationMs;
    try {
      const metadata = player.getMetaData();
      if (metadata.totalTime > 0) {
        replayDurationMs = metadata.totalTime;
      }
    } catch {
      // Fall back to wall-clock span.
    }
    onDurationChange?.(replayDurationMs);

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

    emitTime(0);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (playerInstanceRef.current === player) {
        player.$destroy?.();
        playerInstanceRef.current = null;
      }
      controllerRef.current = null;
      setController(null);
      onControllerReady?.(null);
      container.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventsKey, replayReady]);

  useEffect(() => {
    const container = playerRef.current;
    if (!container || !playerInstanceRef.current) {
      return;
    }
    fitReplayerToViewport(
      container,
      containerSize.width,
      containerSize.height
    );
  }, [containerSize]);

  const handleSeek = useCallback((timeMs: number) => {
    controllerRef.current?.goto(timeMs);
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
          ? "replay-shell-embedded flex h-full min-h-0 w-full flex-col overflow-hidden"
          : "replay-shell relative w-full overflow-hidden rounded-2xl border bg-card"
      }
    >
      <div
        ref={viewportRef}
        className={
          externalChrome
            ? "replay-viewport relative min-h-0 flex-1 overflow-hidden bg-muted/30"
            : "relative w-full"
        }
      >
        <div
          ref={playerRef}
          className="replay-player-host absolute inset-0 [&_.rr-controller]:hidden"
        />
        <ReplayHeatmapOverlay
          hostRef={playerRef}
          active={heatmapEnabled}
          cells={heatmapCells}
          maxClicks={heatmapMaxClicks}
          viewportWidth={heatmapViewportWidth}
          viewportHeight={heatmapViewportHeight}
        />
      </div>
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
            totalDurationMs={wallClockDurationMs}
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
