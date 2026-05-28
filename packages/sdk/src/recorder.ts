import { record } from "rrweb";
import { Batcher } from "./batcher";
import { createFrustrationTracker } from "./frustration";
import {
  applyPrivacySelectors,
  getPrivacyRecordOptions,
  stopPrivacyObserver,
} from "./privacy";
import { clearFrustrationHooks, setFrustrationHooks } from "./telemetry";
import type { InteractionEvent, TelemetryLog } from "./types";

function describeTarget(target: EventTarget | null): string {
  if (!(target instanceof Element)) {
    return "";
  }

  const tag = target.tagName.toLowerCase();
  const id = target.id ? `#${target.id}` : "";
  const className =
    target.classList.length > 0
      ? `.${Array.from(target.classList).slice(0, 3).join(".")}`
      : "";
  const name =
    target instanceof HTMLInputElement && target.name ? `[name=${target.name}]` : "";

  return `${tag}${id}${className}${name}`;
}

function scheduleIdle(task: () => void): void {
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    window.requestIdleCallback(() => task());
    return;
  }
  setTimeout(task, 0);
}

export interface RecorderOptions {
  flushIntervalMs: number;
  maxBatchSize?: number;
  maskSelectors?: string[];
  blockSelectors?: string[];
  maskAllInputs?: boolean;
  onFlush: (
    events: unknown[],
    interactions: InteractionEvent[],
    telemetry: TelemetryLog[],
    useBeacon: boolean
  ) => void;
}

export interface RecorderHandle {
  batcher: Batcher;
  flush: (useBeacon?: boolean) => void;
  stop: (useBeacon?: boolean) => void;
}

export function startRecorder(options: RecorderOptions): RecorderHandle {
  const batcher = new Batcher({
    flushIntervalMs: options.flushIntervalMs,
    maxBatchSize: options.maxBatchSize,
    onFlush: options.onFlush,
  });

  const frustrationTracker = createFrustrationTracker((interaction) => {
    batcher.addInteraction(interaction);
  });

  setFrustrationHooks({
    onNetwork: () => frustrationTracker.onNetworkActivity(),
    onError: () => frustrationTracker.onErrorSignal(),
  });

  applyPrivacySelectors(
    options.maskSelectors ?? [],
    options.blockSelectors ?? []
  );

  const privacyOpts = getPrivacyRecordOptions(options.maskAllInputs ?? false);

  const stopRecord = record({
    emit(event) {
      batcher.addEvent(event);
    },
    ...privacyOpts,
  });

  const onClick = (event: MouseEvent) => {
    scheduleIdle(() => {
      const target = describeTarget(event.target);
      frustrationTracker.onClick(target);
      batcher.addInteraction({
        type: "click",
        x: event.clientX,
        y: event.clientY,
        target,
        timestamp: Date.now(),
      });
    });
  };

  const onScroll = () => {
    scheduleIdle(() => {
      batcher.addInteraction({
        type: "scroll",
        x: window.scrollX,
        y: window.scrollY,
        target: "window",
        timestamp: Date.now(),
      });
    });
  };

  window.addEventListener("click", onClick, true);
  window.addEventListener("scroll", onScroll, { passive: true });

  batcher.start();

  return {
    batcher,
    flush(useBeacon = false) {
      batcher.flush(useBeacon);
    },
    stop(useBeacon = false) {
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("scroll", onScroll);
      frustrationTracker.destroy();
      clearFrustrationHooks();
      stopPrivacyObserver();
      stopRecord?.();
      batcher.stop(useBeacon);
    },
  };
}
