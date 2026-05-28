import { onCLS, onINP, onLCP, onTTFB, type Metric } from "web-vitals";
import type { TelemetryLog } from "./types";

const MAX_TELEMETRY_PER_BATCH = 200;

type ConsoleMethod = (...args: unknown[]) => void;

interface TelemetryState {
  originalConsoleLog: ConsoleMethod;
  originalConsoleWarn: ConsoleMethod;
  originalConsoleError: ConsoleMethod;
  originalConsoleInfo: ConsoleMethod;
  originalFetch: typeof fetch;
  onError: OnErrorEventHandler;
  onUnhandledRejection: (event: PromiseRejectionEvent) => void;
  vitalsStopFns: Array<() => void>;
}

let state: TelemetryState | null = null;
let onLogCaptured: ((log: TelemetryLog) => void) | null = null;
let ingestEndpoint = "";
let onFrustrationNetwork: (() => void) | null = null;
let onFrustrationError: (() => void) | null = null;

export function setFrustrationHooks(hooks: {
  onNetwork: () => void;
  onError: () => void;
}): void {
  onFrustrationNetwork = hooks.onNetwork;
  onFrustrationError = hooks.onError;
}

export function clearFrustrationHooks(): void {
  onFrustrationNetwork = null;
  onFrustrationError = null;
}

function serializeArg(arg: unknown): string {
  if (typeof arg === "object" && arg !== null) {
    try {
      return JSON.stringify(arg);
    } catch {
      return String(arg);
    }
  }
  return String(arg);
}

function captureLog(log: TelemetryLog): void {
  if (!onLogCaptured) {
    return;
  }
  onLogCaptured(log);
}

function shouldSkipNetworkUrl(url: string): boolean {
  if (!ingestEndpoint) {
    return false;
  }
  try {
    const target = new URL(url, window.location.href);
    const endpoint = new URL(ingestEndpoint, window.location.href);
    return target.origin === endpoint.origin && target.pathname === endpoint.pathname;
  } catch {
    return url.includes(ingestEndpoint);
  }
}

function patchConsole(
  subType: string,
  original: ConsoleMethod
): ConsoleMethod {
  return (...args: unknown[]) => {
    const metadata: Record<string, unknown> = {};
    const errorArg = args.find((arg) => arg instanceof Error);
    if (errorArg instanceof Error && errorArg.stack) {
      metadata.stack = errorArg.stack;
    }

    captureLog({
      type: "console",
      subType,
      message: args.map(serializeArg).join(" "),
      timestamp: Date.now(),
      metadata,
    });
    if (subType === "error") {
      onFrustrationError?.();
    }
    original.apply(console, args);
  };
}

function reportVital(metric: Metric): void {
  captureLog({
    type: "vitals",
    subType: metric.name,
    message: `${metric.name}: ${metric.value}`,
    timestamp: Date.now(),
    metadata: {
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
    },
  });
}

export function initializeTelemetry(
  endpoint: string,
  onCaptured: (log: TelemetryLog) => void
): void {
  if (state) {
    return;
  }

  ingestEndpoint = endpoint;
  onLogCaptured = onCaptured;

  const originalConsoleLog = console.log.bind(console);
  const originalConsoleWarn = console.warn.bind(console);
  const originalConsoleError = console.error.bind(console);
  const originalConsoleInfo = console.info.bind(console);
  const originalFetch = window.fetch.bind(window);

  console.log = patchConsole("log", originalConsoleLog);
  console.warn = patchConsole("warn", originalConsoleWarn);
  console.error = patchConsole("error", originalConsoleError);
  console.info = patchConsole("info", originalConsoleInfo);

  const onError: OnErrorEventHandler = (message, source, lineno, colno, error) => {
    const detail =
      error?.message ??
      (typeof message === "string" ? message : message?.toString() ?? "Unknown error");
    captureLog({
      type: "console",
      subType: "error",
      message: `Uncaught: ${detail}`,
      timestamp: Date.now(),
      metadata: {
        source: source ?? "",
        lineno: lineno ?? 0,
        colno: colno ?? 0,
        stack: error?.stack ?? "",
      },
    });
    if (typeof state?.onError === "function") {
      return state.onError(message, source, lineno, colno, error);
    }
    return false;
  };

  const onUnhandledRejection = (event: PromiseRejectionEvent) => {
    const reason =
      event.reason instanceof Error
        ? event.reason.message
        : serializeArg(event.reason);
    captureLog({
      type: "console",
      subType: "error",
      message: `Unhandled rejection: ${reason}`,
      timestamp: Date.now(),
      metadata: {
        stack:
          event.reason instanceof Error ? event.reason.stack ?? "" : undefined,
      },
    });
  };

  window.onerror = onError;
  window.addEventListener("unhandledrejection", onUnhandledRejection);

  window.fetch = async (input, init) => {
    const startTime = Date.now();
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;

    if (shouldSkipNetworkUrl(url)) {
      return originalFetch(input, init);
    }

    const method = init?.method ?? "GET";

    try {
      const response = await originalFetch(input, init);
      const duration = Date.now() - startTime;

      captureLog({
        type: "network",
        subType: "fetch",
        message: `${method} ${url}`,
        timestamp: startTime,
        metadata: {
          status: response.status,
          durationMs: duration,
          ok: response.ok,
        },
      });
      onFrustrationNetwork?.();
      if (!response.ok) {
        onFrustrationError?.();
      }

      return response;
    } catch (error) {
      captureLog({
        type: "network",
        subType: "fetch_error",
        message: `Network Failure: ${method} ${url}`,
        timestamp: startTime,
        metadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
      onFrustrationNetwork?.();
      onFrustrationError?.();
      throw error;
    }
  };

  const vitalsStopFns: Array<() => void> = [];
  onLCP(reportVital);
  onINP(reportVital);
  onCLS(reportVital);
  onTTFB(reportVital);

  state = {
    originalConsoleLog,
    originalConsoleWarn,
    originalConsoleError,
    originalConsoleInfo,
    originalFetch,
    onError,
    onUnhandledRejection,
    vitalsStopFns,
  };
}

export function stopTelemetry(): void {
  if (!state) {
    return;
  }

  console.log = state.originalConsoleLog;
  console.warn = state.originalConsoleWarn;
  console.error = state.originalConsoleError;
  console.info = state.originalConsoleInfo;
  window.fetch = state.originalFetch;
  window.onerror = state.onError;
  window.removeEventListener("unhandledrejection", state.onUnhandledRejection);

  for (const stop of state.vitalsStopFns) {
    stop();
  }

  state = null;
  onLogCaptured = null;
  ingestEndpoint = "";
  clearFrustrationHooks();
}
