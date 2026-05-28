"use client";

import { useMemo, useState } from "react";
import type { LogItem } from "@/components/TechTimeline";
import DevLogPanel from "@/components/DevLogPanel";
import ReplayPlayer from "@/components/ReplayPlayer";
import type { ReplayController } from "@/components/ReplayControls";
import SessionClientHeader, {
  type SessionMeta,
} from "@/components/SessionClientHeader";
import SessionPageTabs from "@/components/SessionPageTabs";
import SessionTimelineBar from "@/components/SessionTimelineBar";
import { computeInactivitySegments } from "@/lib/inactivity-segments";
import {
  extractSessionPages,
  getActivePageIndex,
  type SessionPage,
} from "@/lib/session-pages";
import {
  getSessionDurationMs,
  getSessionStartTimeMs,
} from "@/lib/replay";
import type { TimelineMarker } from "@/lib/session-markers";

interface SessionReplayWorkspaceProps {
  sessionMeta: SessionMeta;
  events: unknown[];
  logs: LogItem[];
  timelineMarkers: TimelineMarker[];
  currentVideoTimeMs: number;
  sessionStartTimeMs: number;
  onTimeUpdate: (timeMs: number) => void;
  onSessionStartTime: (startTimeMs: number) => void;
  registerSeek: (seek: (timeMs: number) => void) => void;
}

export default function SessionReplayWorkspace({
  sessionMeta,
  events,
  logs,
  timelineMarkers,
  currentVideoTimeMs,
  sessionStartTimeMs,
  onTimeUpdate,
  onSessionStartTime,
  registerSeek,
}: SessionReplayWorkspaceProps) {
  const [controller, setController] = useState<ReplayController | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(1);
  const [selectedPageIndex, setSelectedPageIndex] = useState<number | null>(
    null
  );

  const pages = useMemo(
    () => extractSessionPages(events, sessionMeta.initial_url),
    [events, sessionMeta.initial_url]
  );

  const totalDurationMs = useMemo(
    () => getSessionDurationMs(events),
    [events]
  );

  const startMs = useMemo(
    () => sessionStartTimeMs || getSessionStartTimeMs(events),
    [sessionStartTimeMs, events]
  );

  const inactivitySegments = useMemo(
    () => computeInactivitySegments(events, startMs, totalDurationMs),
    [events, startMs, totalDurationMs]
  );

  const activePageIndex =
    selectedPageIndex ?? getActivePageIndex(pages, currentVideoTimeMs);

  const activePage: SessionPage | undefined = pages[activePageIndex];

  const handleSeek = (timeMs: number) => {
    controller?.goto(timeMs);
    onTimeUpdate(timeMs);
  };

  const handlePageSelect = (page: SessionPage) => {
    setSelectedPageIndex(page.index);
    handleSeek(page.startTimeMs);
  };

  return (
    <div className="space-y-3">
      <SessionClientHeader meta={sessionMeta} />

      {pages.length > 0 && (
        <SessionPageTabs
          pages={pages}
          activeIndex={activePageIndex}
          onSelect={handlePageSelect}
        />
      )}

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-3">
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="border-b bg-muted/20 px-4 py-2">
              <p className="font-medium text-foreground text-sm">
                {activePage?.title ?? "Session replay"}
              </p>
              <p className="truncate text-muted-foreground text-xs">
                {activePage?.href ?? sessionMeta.initial_url}
              </p>
            </div>
            <ReplayPlayer
              events={events}
              timelineMarkers={timelineMarkers}
              chrome="external"
              currentVideoTimeMs={currentVideoTimeMs}
              onTimeUpdate={onTimeUpdate}
              onSessionStartTime={onSessionStartTime}
              registerSeek={registerSeek}
              onControllerReady={setController}
              onPlayStateChange={setIsPlaying}
              onSpeedChange={setCurrentSpeed}
            />
          </div>

          <SessionTimelineBar
            controller={controller}
            isPlaying={isPlaying}
            currentSpeed={currentSpeed}
            currentTimeMs={currentVideoTimeMs}
            totalDurationMs={totalDurationMs}
            sessionStartTimeMs={startMs}
            markers={timelineMarkers}
            pages={pages}
            inactivitySegments={inactivitySegments}
            onSeek={handleSeek}
            onPlayStateChange={setIsPlaying}
            onSpeedChange={setCurrentSpeed}
          />
        </div>

        <DevLogPanel
          logs={logs}
          currentVideoTimeMs={currentVideoTimeMs}
          sessionStartTimeMs={startMs}
          onSeek={handleSeek}
        />
      </div>
    </div>
  );
}
