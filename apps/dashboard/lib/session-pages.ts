import {
  getSessionDurationMs,
  getSessionStartTimeMs,
  prepareReplayEvents,
} from "@/lib/replay";

const RRWEB_META = 4;
const RRWEB_FULL_SNAPSHOT = 2;

export interface SessionPage {
  id: string;
  index: number;
  title: string;
  href: string;
  pathname: string;
  startTimeMs: number;
  endTimeMs: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function eventTimestamp(event: unknown): number {
  if (!isRecord(event)) return 0;
  return typeof event.timestamp === "number" ? event.timestamp : 0;
}

function eventType(event: unknown): number {
  if (!isRecord(event)) return 0;
  return typeof event.type === "number" ? event.type : 0;
}

function pageTitleFromHref(href: string, index: number): string {
  try {
    const url = new URL(href);
    const path = url.pathname.replace(/\/$/, "") || "/";
    if (path === "/" || path === "/index.html") return "Home";
    const segment = path.split("/").filter(Boolean).pop() ?? "Page";
    const label = segment
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return label.length > 18 ? `${label.slice(0, 15)}…` : label;
  } catch {
    return `Page ${index + 1}`;
  }
}

function pathnameFromHref(href: string): string {
  try {
    return new URL(href).pathname;
  } catch {
    return href;
  }
}

export function extractSessionPages(
  events: unknown[],
  fallbackUrl?: string
): SessionPage[] {
  const sorted = prepareReplayEvents(events);
  if (sorted.length === 0) return [];

  const sessionStart = getSessionStartTimeMs(sorted);
  const sessionEnd = sessionStart + getSessionDurationMs(sorted);

  const navigations: { href: string; timestamp: number }[] = [];

  for (const event of sorted) {
    const type = eventType(event);
    if (type === RRWEB_META && isRecord(event) && isRecord(event.data)) {
      const href = typeof event.data.href === "string" ? event.data.href : "";
      if (href) {
        navigations.push({ href, timestamp: eventTimestamp(event) });
      }
    }
    if (type === RRWEB_FULL_SNAPSHOT && navigations.length === 0 && fallbackUrl) {
      navigations.push({ href: fallbackUrl, timestamp: eventTimestamp(event) });
    }
  }

  if (navigations.length === 0 && fallbackUrl) {
    navigations.push({ href: fallbackUrl, timestamp: sessionStart });
  }

  const unique: { href: string; timestamp: number }[] = [];
  for (const nav of navigations) {
    const last = unique[unique.length - 1];
    if (!last || pathnameFromHref(last.href) !== pathnameFromHref(nav.href)) {
      unique.push(nav);
    }
  }

  return unique.map((nav, index) => {
    const next = unique[index + 1];
    const start = nav.timestamp - sessionStart;
    const end = next ? next.timestamp - sessionStart : sessionEnd - sessionStart;
    return {
      id: `page-${index}`,
      index,
      title: pageTitleFromHref(nav.href, index),
      href: nav.href,
      pathname: pathnameFromHref(nav.href),
      startTimeMs: Math.max(0, start),
      endTimeMs: Math.max(start, end),
    };
  });
}

export function getActivePageIndex(
  pages: SessionPage[],
  currentTimeMs: number
): number {
  if (pages.length === 0) return 0;
  for (let i = pages.length - 1; i >= 0; i -= 1) {
    if (currentTimeMs >= pages[i].startTimeMs) return i;
  }
  return 0;
}
