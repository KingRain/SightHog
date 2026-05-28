import type { InteractionEvent } from "./types";

const RAGE_CLICK_COUNT = 5;
const RAGE_CLICK_WINDOW_MS = 2000;
const DEAD_CLICK_MS = 1500;
const ERROR_CLICK_WINDOW_MS = 500;

type FrustrationType = "rage_click" | "dead_click" | "error_click";

interface ClickWindow {
  target: string;
  timestamps: number[];
}

interface PendingClick {
  target: string;
  timestamp: number;
  hadNetwork: boolean;
  timer: ReturnType<typeof setTimeout>;
}

export interface FrustrationTracker {
  onClick: (target: string) => void;
  onNetworkActivity: () => void;
  onErrorSignal: () => void;
  destroy: () => void;
}

export function createFrustrationTracker(
  onEmit: (interaction: InteractionEvent) => void
): FrustrationTracker {
  const rageWindows = new Map<string, ClickWindow>();
  const pendingClicks: PendingClick[] = [];
  let networkActivitySinceLastClick = false;

  const emit = (type: FrustrationType, target: string, timestamp: number) => {
    onEmit({
      type,
      target,
      timestamp,
      metadata: { frustration: type },
    });
  };

  const checkRage = (target: string, timestamp: number) => {
    const key = target || "unknown";
    const existing = rageWindows.get(key) ?? { target: key, timestamps: [] };
    existing.timestamps = existing.timestamps
      .filter((t) => timestamp - t <= RAGE_CLICK_WINDOW_MS)
      .concat(timestamp);
    rageWindows.set(key, existing);

    if (existing.timestamps.length >= RAGE_CLICK_COUNT) {
      emit("rage_click", key, timestamp);
      rageWindows.set(key, { target: key, timestamps: [] });
    }
  };

  const checkErrorClicks = (timestamp: number) => {
    for (let i = pendingClicks.length - 1; i >= 0; i -= 1) {
      const pending = pendingClicks[i];
      if (timestamp - pending.timestamp <= ERROR_CLICK_WINDOW_MS) {
        emit("error_click", pending.target, pending.timestamp);
      }
    }
    pendingClicks.length = 0;
  };

  return {
    onClick(target: string) {
      const timestamp = Date.now();
      networkActivitySinceLastClick = false;
      checkRage(target, timestamp);

      const timer = setTimeout(() => {
        const idx = pendingClicks.findIndex((p) => p.timer === timer);
        if (idx === -1) return;
        const pending = pendingClicks[idx];
        if (!pending.hadNetwork && !networkActivitySinceLastClick) {
          emit("dead_click", pending.target, pending.timestamp);
        }
        pendingClicks.splice(idx, 1);
      }, DEAD_CLICK_MS);

      pendingClicks.push({
        target: target || "unknown",
        timestamp,
        hadNetwork: false,
        timer,
      });

      if (pendingClicks.length > 50) {
        const removed = pendingClicks.shift();
        if (removed) clearTimeout(removed.timer);
      }
    },

    onNetworkActivity() {
      networkActivitySinceLastClick = true;
      for (const pending of pendingClicks) {
        pending.hadNetwork = true;
      }
    },

    onErrorSignal() {
      checkErrorClicks(Date.now());
    },

    destroy() {
      for (const pending of pendingClicks) {
        clearTimeout(pending.timer);
      }
      pendingClicks.length = 0;
      rageWindows.clear();
    },
  };
}
