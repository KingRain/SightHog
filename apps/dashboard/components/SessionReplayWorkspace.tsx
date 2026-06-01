"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useReplayKeyboard } from "@/hooks/useReplayKeyboard";
import DevLogPanel from "@/components/DevLogPanel";
import ReplayPlayer from "@/components/ReplayPlayer";
import SessionClientHeader from "@/components/SessionClientHeader";
import SessionPageTabs from "@/components/SessionPageTabs";
import SessionTimelineBar from "@/components/SessionTimelineBar";
import { computeInactivitySegments } from "@/lib/inactivity-segments";
import {
  extractSessionPages,
  getActivePageIndex,
  type SessionPage,
} from "@/lib/session-pages";
import { getSessionDurationMs, getSessionStartTimeMs } from "@/lib/replay";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  filterCellsForPage,
  getViewportFromEvents,
} from "@/lib/heatmap";
import {
  clearHeatmap,
  setController,
  setCurrentTimeMs,
  setHeatmapCells,
  setHeatmapLoading,
  setIsPlaying,
  setSelectedPageIndex,
  setSessionStartTimeMs,
  setSpeed,
  setTotalDurationMs,
} from "@/store/replaySlice";

export default function SessionReplayWorkspace() {
  const dispatch = useAppDispatch();
  const sessionMeta = useAppSelector((s) => s.session.sessionMeta);
  const events = useAppSelector((s) => s.session.sessionEvents);
  const logs = useAppSelector((s) => s.session.telemetryLogs);
  const timelineMarkers = useAppSelector((s) => s.session.timelineMarkers);
  const currentVideoTimeMs = useAppSelector((s) => s.replay.currentTimeMs);
  const sessionStartTimeMs = useAppSelector((s) => s.replay.sessionStartTimeMs);
  const totalDurationMs = useAppSelector((s) => s.replay.totalDurationMs);
  const isPlaying = useAppSelector((s) => s.replay.isPlaying);
  const currentSpeed = useAppSelector((s) => s.replay.speed);
  const selectedPageIndex = useAppSelector((s) => s.replay.selectedPageIndex);
  const controller = useAppSelector((s) => s.replay.controller);
  const heatmapEnabled = useAppSelector((s) => s.replay.heatmapEnabled);
  const heatmapCells = useAppSelector((s) => s.replay.heatmapCells);
  const heatmapMaxClicks = useAppSelector((s) => s.replay.heatmapMaxClicks);
  const sessionId = useAppSelector((s) => s.session.selectedSessionId);

  const pages = useMemo(
    () =>
      sessionMeta
        ? extractSessionPages(events, sessionMeta.initial_url)
        : [],
    [events, sessionMeta]
  );

  const computedDuration = useMemo(
    () => getSessionDurationMs(events),
    [events]
  );

  const timelineDurationMs =
    totalDurationMs > 0 ? totalDurationMs : computedDuration;

  const startMs = useMemo(
    () => sessionStartTimeMs || getSessionStartTimeMs(events),
    [sessionStartTimeMs, events]
  );

  useEffect(() => {
    if (computedDuration > 0 && totalDurationMs === 0) {
      dispatch(setTotalDurationMs(computedDuration));
    }
  }, [computedDuration, totalDurationMs, dispatch]);

  const inactivitySegments = useMemo(
    () => computeInactivitySegments(events, startMs, computedDuration),
    [events, startMs, computedDuration]
  );

  const activePageIndex =
    selectedPageIndex ?? getActivePageIndex(pages, currentVideoTimeMs);

  const replayPageIndex = getActivePageIndex(pages, currentVideoTimeMs);
  const heatmapPage = pages[replayPageIndex] ?? pages[0] ?? null;

  const pageHeatmapCells = useMemo(
    () =>
      heatmapPage
        ? filterCellsForPage(heatmapCells, heatmapPage.href)
        : heatmapCells,
    [heatmapCells, heatmapPage]
  );

  const pageViewport = useMemo(
    () => getViewportFromEvents(events, heatmapPage?.href),
    [events, heatmapPage?.href]
  );

  useEffect(() => {
    if (!sessionId) {
      dispatch(clearHeatmap());
      return;
    }

    let cancelled = false;
    dispatch(setHeatmapLoading(true));

    fetch(`/api/session/${sessionId}/heatmap`)
      .then(async (res) => {
        if (!res.ok) throw new Error("heatmap fetch failed");
        return res.json() as Promise<{ cells: typeof heatmapCells; maxClicks: number }>;
      })
      .then((data) => {
        if (!cancelled) {
          dispatch(
            setHeatmapCells({
              cells: data.cells ?? [],
              maxClicks: data.maxClicks ?? 0,
            })
          );
        }
      })
      .catch(() => {
        if (!cancelled) dispatch(clearHeatmap());
      })
      .finally(() => {
        if (!cancelled) dispatch(setHeatmapLoading(false));
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId, dispatch]);

  const playerSeekRef = useRef<(timeMs: number) => void>(() => {});

  const handleSeek = useCallback(
    (timeMs: number) => {
      const clamped = Math.max(0, Math.min(timelineDurationMs, timeMs));
      playerSeekRef.current(clamped);
      controller?.goto(clamped);
      dispatch(setCurrentTimeMs(clamped));
    },
    [timelineDurationMs, controller, dispatch]
  );

  const handlePageSelect = (page: SessionPage) => {
    dispatch(setSelectedPageIndex(page.index));
    handleSeek(page.startTimeMs);
  };

  const registerSeek = useCallback((seek: (timeMs: number) => void) => {
    playerSeekRef.current = seek;
  }, []);

  useReplayKeyboard({
    controller,
    isPlaying,
    currentTimeMs: currentVideoTimeMs,
    currentSpeed,
    totalDurationMs: timelineDurationMs,
    onSeek: handleSeek,
    onPlayStateChange: (playing) => dispatch(setIsPlaying(playing)),
    onSpeedChange: (speed) => dispatch(setSpeed(speed)),
    enabled: Boolean(sessionMeta) && events.length > 0,
  });

  if (!sessionMeta) {
    return null;
  }

  return (
    <div className="flex h-[min(920px,calc(100vh-6rem))] min-h-[640px] flex-col overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="shrink-0 space-y-3 border-b border-border/80 bg-gradient-to-b from-card to-muted/20 p-3 sm:p-4">
        <SessionClientHeader meta={sessionMeta} />
        {pages.length > 0 && (
          <SessionPageTabs
            pages={pages}
            activeIndex={activePageIndex}
            onSelect={handlePageSelect}
          />
        )}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden xl:grid-cols-[minmax(0,1fr)_440px]">
        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden border-b border-border/80 xl:border-b-0 xl:border-r">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[color-mix(in_srgb,var(--background)_92%,var(--foreground))]">
            <ReplayPlayer
              events={events}
              timelineMarkers={timelineMarkers}
              chrome="external"
              currentVideoTimeMs={currentVideoTimeMs}
              onTimeUpdate={(ms) => dispatch(setCurrentTimeMs(ms))}
              onSessionStartTime={(ms) => dispatch(setSessionStartTimeMs(ms))}
              onDurationChange={(ms) => dispatch(setTotalDurationMs(ms))}
              registerSeek={registerSeek}
              onControllerReady={(c) => dispatch(setController(c))}
              onPlayStateChange={(p) => dispatch(setIsPlaying(p))}
              onSpeedChange={(s) => dispatch(setSpeed(s))}
              heatmapEnabled={heatmapEnabled}
              heatmapCells={pageHeatmapCells}
              heatmapMaxClicks={heatmapMaxClicks}
              heatmapViewportWidth={pageViewport.width}
              heatmapViewportHeight={pageViewport.height}
            />
          </div>
          <div className="shrink-0 border-t border-border/80 bg-card p-2 sm:p-3">
            <SessionTimelineBar
              onSeek={handleSeek}
              markers={timelineMarkers}
              pages={pages}
              inactivitySegments={inactivitySegments}
              totalDurationMs={timelineDurationMs}
              sessionStartTimeMs={startMs}
            />
          </div>
        </div>

        <div className="flex min-h-[320px] min-w-0 flex-col overflow-hidden p-2 xl:min-h-0 xl:p-3">
          <DevLogPanel
            logs={logs}
            currentVideoTimeMs={currentVideoTimeMs}
            sessionStartTimeMs={startMs}
            onSeek={handleSeek}
          />
        </div>
      </div>
    </div>
  );
}
