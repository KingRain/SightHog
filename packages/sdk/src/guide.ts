import type { GuideMessage } from "./types";

export function initGuide(_options?: { wsUrl?: string }): void {
  // Phase 3: WebSocket proactive guide will be implemented here.
}

export function handleGuideMessage(_message: GuideMessage): void {
  // Phase 3: render CSS-animated guide overlay.
}

export function stopGuide(): void {
  // Phase 3: tear down guide WebSocket connection.
}
