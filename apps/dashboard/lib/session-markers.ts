import type { LogItem } from "@/components/TechTimeline";
import { SLOW_NETWORK_MS } from "@/lib/timeline-feed";

export type MarkerKind = "error" | "slow" | "action" | "info";

export interface SessionInteraction {
  type: string;
  x: number;
  y: number;
  target: string;
  timestamp: number;
}

export interface TimelineMarker {
  tag: string;
  kind: MarkerKind;
  timestamp: number;
  label: string;
}

const RRWEB_CUSTOM = 5;

export const TIMELINE_MARKER_COLORS: Record<MarkerKind, string> = {
  error: "var(--destructive)",
  slow: "var(--warning)",
  action: "var(--info)",
  info: "var(--chart-5)",
};

export const TIMELINE_TAG_COLORS: Record<string, string> = {
  click: "var(--info)",
  scroll: "var(--chart-4)",
  network: "var(--chart-2)",
  console: "var(--info)",
  error: "var(--destructive)",
  vitals: "var(--chart-5)",
  action: "var(--info)",
  pageview: "var(--muted-foreground)",
};

function classifyLogMarker(log: LogItem): TimelineMarker | null {
  if (log.type === "action") {
    const kind: MarkerKind =
      log.subType === "rage_click" || log.subType === "error_click"
        ? "error"
        : log.subType === "dead_click"
          ? "slow"
          : "action";
    return {
      tag: log.subType,
      kind,
      timestamp: log.timestamp,
      label: log.message,
    };
  }

  if (log.type === "console") {
    const kind: MarkerKind = log.subType === "error" ? "error" : "info";
    return {
      tag: log.subType === "error" ? "error" : "console",
      kind,
      timestamp: log.timestamp,
      label: log.message.slice(0, 80),
    };
  }

  if (log.type === "network") {
    const status = Number(log.metadata.status ?? 0);
    const durationMs = Number(log.metadata.durationMs ?? 0);
    const isError = log.subType === "fetch_error" || status >= 500;
    const isSlow = durationMs >= SLOW_NETWORK_MS;

    return {
      tag: "network",
      kind: isError ? "error" : isSlow ? "slow" : "info",
      timestamp: log.timestamp,
      label: log.message.slice(0, 80),
    };
  }

  if (log.type === "vitals") {
    return {
      tag: "vitals",
      kind: "info",
      timestamp: log.timestamp,
      label: log.message.slice(0, 80),
    };
  }

  return null;
}

export function buildTimelineMarkersFromLogs(logs: LogItem[]): TimelineMarker[] {
  return logs
    .map(classifyLogMarker)
    .filter((marker): marker is TimelineMarker => marker !== null);
}

export function buildTimelineMarkers(
  interactions: SessionInteraction[],
  telemetry: LogItem[]
): TimelineMarker[] {
  void interactions;
  void telemetry;
  return [];
}

export function injectTimelineMarkers(
  events: unknown[],
  markers: TimelineMarker[]
): unknown[] {
  if (markers.length === 0) {
    return events;
  }

  const customEvents = markers.map((marker) => ({
    type: RRWEB_CUSTOM,
    timestamp: marker.timestamp,
    data: {
      tag: marker.tag,
      payload: { label: marker.label, kind: marker.kind },
    },
  }));

  return [...events, ...customEvents].sort((a, b) => {
    const ta =
      typeof a === "object" && a !== null && "timestamp" in a
        ? Number((a as { timestamp: number }).timestamp)
        : 0;
    const tb =
      typeof b === "object" && b !== null && "timestamp" in b
        ? Number((b as { timestamp: number }).timestamp)
        : 0;
    return ta - tb;
  });
}

export function markerPercent(
  timestamp: number,
  sessionStartTimeMs: number,
  totalDurationMs: number
): number {
  if (totalDurationMs <= 0) {
    return 0;
  }
  const relative = timestamp - sessionStartTimeMs;
  return Math.min(100, Math.max(0, (relative / totalDurationMs) * 100));
}
