import { isFullSnapshotEvent } from "./rrweb-events";
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
  private hasFullSnapshot = false;
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
    if (isFullSnapshotEvent(event)) {
      this.hasFullSnapshot = true;
      this.flush(false);
      return;
    }
    if (this.hasFullSnapshot && this.events.length >= this.maxBatchSize) {
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
    const canSendEvents = this.hasFullSnapshot || useBeacon;
    const events = canSendEvents ? this.events : [];
    const interactions = this.interactions;
    const telemetry = this.telemetry;

    if (
      events.length === 0 &&
      interactions.length === 0 &&
      telemetry.length === 0
    ) {
      return;
    }

    if (canSendEvents) {
      this.events = [];
    }
    this.interactions = [];
    this.telemetry = [];
    this.telemetryCount = 0;

    this.onFlush(events, interactions, telemetry, useBeacon);
  }
}
