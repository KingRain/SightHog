import type { InteractionEvent, TelemetryLog } from "./types";

const DEFAULT_MAX_BATCH_SIZE = 500;
const MAX_TELEMETRY_PER_BATCH = 200;

export interface BatcherOptions {
  flushIntervalMs: number;
  maxBatchSize?: number;
  onFlush: (
    events: unknown[],
    interactions: InteractionEvent[],
    telemetry: TelemetryLog[],
    useBeacon: boolean
  ) => void;
}

export class Batcher {
  private events: unknown[] = [];
  private interactions: InteractionEvent[] = [];
  private telemetry: TelemetryLog[] = [];
  private telemetryCount = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly flushIntervalMs: number;
  private readonly maxBatchSize: number;
  private readonly onFlush: BatcherOptions["onFlush"];

  constructor(options: BatcherOptions) {
    this.flushIntervalMs = options.flushIntervalMs;
    this.maxBatchSize = options.maxBatchSize ?? DEFAULT_MAX_BATCH_SIZE;
    this.onFlush = options.onFlush;
  }

  start(): void {
    if (this.timer) {
      return;
    }
    this.timer = setInterval(() => this.flush(false), this.flushIntervalMs);
  }

  stop(useBeacon = false): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.flush(useBeacon);
  }

  addEvent(event: unknown): void {
    this.events.push(event);
    if (this.events.length >= this.maxBatchSize) {
      this.flush(false);
    }
  }

  addInteraction(interaction: InteractionEvent): void {
    this.interactions.push(interaction);
  }

  addTelemetry(log: TelemetryLog): void {
    if (this.telemetryCount >= MAX_TELEMETRY_PER_BATCH) {
      return;
    }
    this.telemetryCount += 1;
    this.telemetry.push(log);
  }

  flush(useBeacon: boolean): void {
    if (
      this.events.length === 0 &&
      this.interactions.length === 0 &&
      this.telemetry.length === 0
    ) {
      return;
    }

    const events = this.events;
    const interactions = this.interactions;
    const telemetry = this.telemetry;
    this.events = [];
    this.interactions = [];
    this.telemetry = [];
    this.telemetryCount = 0;

    this.onFlush(events, interactions, telemetry, useBeacon);
  }
}
