const POLL_INTERVAL_MS = 2500;
const MAX_ATTEMPTS = 24;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForReplayReady(
  sessionId: string,
  onWaiting?: (attempt: number) => void
): Promise<void> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    onWaiting?.(attempt + 1);
    const res = await fetch(`/api/session/${sessionId}/ready`, {
      cache: "no-store",
    });
    if (res.ok) {
      return;
    }
    await sleep(POLL_INTERVAL_MS);
  }
  throw new Error("Replay is still processing. Try again in a few seconds.");
}

export async function fetchReplayEvents(sessionId: string) {
  const res = await fetch(`/api/session/${sessionId}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Session replay not found");
  }
  return res.json() as Promise<{
    events: unknown[];
    hasFullSnapshot?: boolean;
    eventCount?: number;
  }>;
}
