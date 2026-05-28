export type InteractionType =
  | "click"
  | "scroll"
  | "rage_click"
  | "dead_click"
  | "error_click"
  | (string & {});

export type TelemetryType = "network" | "console" | "vitals";

export interface TelemetryLog {
  type: TelemetryType;
  subType: string;
  message: string;
  timestamp: number;
  metadata: Record<string, unknown>;
}

export interface InteractionEvent {
  type: InteractionType;
  x?: number;
  y?: number;
  target?: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface EventBatch {
  sessionId: string;
  userId?: string;
  url: string;
  timestamp: number;
  events: unknown[];
  interactions: InteractionEvent[];
  telemetry?: TelemetryLog[];
}

export interface SightHogOptions {
  endpoint: string;
  sessionId?: string;
  userId?: string;
  flushIntervalMs?: number;
  maxBatchSize?: number;
}

export interface GuideMessage {
  type: "guide";
  message: string;
  selector?: string;
  x?: number;
  y?: number;
}
