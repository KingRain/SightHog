import type { EventBatch } from "./types";

const MAX_RETRIES = 1;

export async function sendBatch(
  endpoint: string,
  batch: EventBatch,
  useBeacon = false
): Promise<void> {
  const body = JSON.stringify(batch);

  if (useBeacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon(endpoint, blob);
    return;
  }

  let attempt = 0;
  while (attempt <= MAX_RETRIES) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
        credentials: "omit",
        mode: "cors",
      });

      if (!response.ok) {
        throw new Error(`Ingest failed with status ${response.status}`);
      }
      return;
    } catch (error) {
      if (attempt >= MAX_RETRIES) {
        console.warn("[SightHog] Failed to flush event batch", error);
        return;
      }
      attempt += 1;
    }
  }
}
