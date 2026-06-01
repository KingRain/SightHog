const RRWEB_FULL_SNAPSHOT = 2;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function eventTimestamp(event: unknown): number {
  if (!isRecord(event)) {
    return 0;
  }
  const timestamp = event.timestamp;
  return typeof timestamp === "number" ? timestamp : 0;
}

function eventType(event: unknown): number {
  if (!isRecord(event)) {
    return 0;
  }
  const type = event.type;
  if (typeof type === "number") {
    return type;
  }
  if (typeof type === "string") {
    const parsed = Number.parseInt(type, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export function sortReplayEvents(events: unknown[]): unknown[] {
  return [...events].sort((a, b) => eventTimestamp(a) - eventTimestamp(b));
}

export function hasFullSnapshot(events: unknown[]): boolean {
  return events.some((event) => eventType(event) === RRWEB_FULL_SNAPSHOT);
}

/** rrweb mutates events during playback (e.g. adds `delay`); Redux state is frozen. */
export function cloneReplayEvents(events: unknown[]): unknown[] {
  const sorted = sortReplayEvents(events);
  if (typeof structuredClone === "function") {
    try {
      return structuredClone(sorted);
    } catch {
      // Fall through for non-cloneable payloads.
    }
  }
  return JSON.parse(JSON.stringify(sorted)) as unknown[];
}

export function prepareReplayEvents(events: unknown[]): unknown[] {
  return cloneReplayEvents(events);
}

export { injectTimelineMarkers } from "@/lib/session-markers";

export function getSessionStartTimeMs(events: unknown[]): number {
  const sorted = prepareReplayEvents(events);
  if (sorted.length === 0) {
    return 0;
  }
  return eventTimestamp(sorted[0]);
}

export function getSessionEndTimeMs(events: unknown[]): number {
  const sorted = prepareReplayEvents(events);
  if (sorted.length === 0) {
    return 0;
  }
  return eventTimestamp(sorted[sorted.length - 1]);
}

export function getSessionDurationMs(events: unknown[]): number {
  const start = getSessionStartTimeMs(events);
  const end = getSessionEndTimeMs(events);
  return Math.max(0, end - start);
}

/** Replay wall-clock span between first and last rrweb event. */
export function getReplayWallClockDurationMs(events: unknown[]): number {
  return getSessionDurationMs(events);
}
