import { prepareReplayEvents } from "@/lib/replay";

const DEFAULT_GAP_MS = 2500;

export interface InactivitySegment {
  startPercent: number;
  endPercent: number;
}

function eventTimestamp(event: unknown): number {
  if (typeof event !== "object" || event === null) return 0;
  const ts = (event as { timestamp?: number }).timestamp;
  return typeof ts === "number" ? ts : 0;
}

export function computeInactivitySegments(
  events: unknown[],
  sessionStartTimeMs: number,
  totalDurationMs: number,
  minGapMs = DEFAULT_GAP_MS
): InactivitySegment[] {
  if (totalDurationMs <= 0) return [];

  const sorted = prepareReplayEvents(events);
  const timestamps = sorted
    .map(eventTimestamp)
    .filter((t) => t >= sessionStartTimeMs)
    .sort((a, b) => a - b);

  if (timestamps.length < 2) return [];

  const segments: InactivitySegment[] = [];

  for (let i = 1; i < timestamps.length; i += 1) {
    const gap = timestamps[i] - timestamps[i - 1];
    if (gap < minGapMs) continue;

    const startMs = timestamps[i - 1] - sessionStartTimeMs;
    const endMs = timestamps[i] - sessionStartTimeMs;
    segments.push({
      startPercent: (startMs / totalDurationMs) * 100,
      endPercent: (endMs / totalDurationMs) * 100,
    });
  }

  return segments;
}
