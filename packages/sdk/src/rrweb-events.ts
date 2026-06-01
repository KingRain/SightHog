const RRWEB_FULL_SNAPSHOT = 2;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isFullSnapshotEvent(event: unknown): boolean {
  if (!isRecord(event)) {
    return false;
  }
  const type = event.type;
  if (typeof type === "number") {
    return type === RRWEB_FULL_SNAPSHOT;
  }
  if (typeof type === "string") {
    return Number.parseInt(type, 10) === RRWEB_FULL_SNAPSHOT;
  }
  return false;
}
