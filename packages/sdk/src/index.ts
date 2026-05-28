import { initGuide, stopGuide } from "./guide";
import { startRecorder, type RecorderHandle } from "./recorder";
import { initializeTelemetry, stopTelemetry } from "./telemetry";
import { sendBatch } from "./transport";
import type { EventBatch, SightHogOptions, TelemetryLog } from "./types";

const DEFAULT_FLUSH_INTERVAL_MS = 5000;

let recorderHandle: RecorderHandle | null = null;
let sessionId = "";
let endpoint = "";
let userId: string | undefined;

const SESSION_STORAGE_KEY = "sighthog:sessionId";
const USER_STORAGE_KEY = "sighthog:userId";

function createSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getOrCreateStoredId(key: string, factory: () => string): string {
  if (typeof window === "undefined") {
    return factory();
  }
  try {
    const existing = sessionStorage.getItem(key);
    if (existing) {
      return existing;
    }
    const created = factory();
    sessionStorage.setItem(key, created);
    return created;
  } catch {
    return factory();
  }
}

export function getSightHogSessionId(): string {
  return sessionId;
}

export function resetSightHogSession(): void {
  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      sessionStorage.removeItem(USER_STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
  }
  sessionId = "";
  userId = undefined;
}

function buildBatch(
  events: unknown[],
  interactions: EventBatch["interactions"],
  telemetry: TelemetryLog[]
): EventBatch {
  const batch: EventBatch = {
    sessionId,
    userId,
    url: window.location.href,
    timestamp: Date.now(),
    events,
    interactions,
  };

  if (telemetry.length > 0) {
    batch.telemetry = telemetry;
  }

  return batch;
}

export function initSightHog(options: SightHogOptions): void {
  if (recorderHandle) {
    return;
  }

  endpoint = options.endpoint;
  sessionId =
    options.sessionId ??
    getOrCreateStoredId(SESSION_STORAGE_KEY, createSessionId);
  userId =
    options.userId ?? getOrCreateStoredId(USER_STORAGE_KEY, () => sessionId);

  const flushIntervalMs = options.flushIntervalMs ?? DEFAULT_FLUSH_INTERVAL_MS;

  recorderHandle = startRecorder({
    flushIntervalMs,
    maxBatchSize: options.maxBatchSize,
    onFlush: (events, interactions, telemetry, useBeacon) => {
      const batch = buildBatch(events, interactions, telemetry);
      void sendBatch(endpoint, batch, useBeacon);
    },
  });

  initializeTelemetry(endpoint, (log) => {
    recorderHandle?.batcher.addTelemetry(log);
  });

  initGuide();

  window.addEventListener("beforeunload", () => {
    recorderHandle?.stop(true);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      recorderHandle?.flush(true);
    }
  });
}

export function stopSightHog(): void {
  stopTelemetry();
  recorderHandle?.stop(false);
  recorderHandle = null;
  stopGuide();
}

export function trackEvent(eventName: string, metricValue = 1): void {
  if (!recorderHandle) {
    return;
  }
  recorderHandle.batcher.addInteraction({
    type: eventName,
    target: window.location.pathname,
    timestamp: Date.now(),
    metadata: { metricValue },
  });
}

export type {
  SightHogOptions,
  EventBatch,
  InteractionEvent,
  TelemetryLog,
} from "./types";
