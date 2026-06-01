export const HEATMAP_BIN_SIZE = 40;

export interface HeatmapCell {
  url: string;
  x: number;
  y: number;
  clicks: number;
}

export interface HeatmapData {
  cells: HeatmapCell[];
  maxClicks: number;
}

const RRWEB_META = 4;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function urlsMatch(cellUrl: string, pageHref: string): boolean {
  if (!cellUrl || !pageHref) return false;
  if (cellUrl === pageHref) return true;
  try {
    const a = new URL(cellUrl);
    const b = new URL(pageHref);
    return a.origin === b.origin && a.pathname === b.pathname;
  } catch {
    return cellUrl.includes(pageHref) || pageHref.includes(cellUrl);
  }
}

export function filterCellsForPage(
  cells: HeatmapCell[],
  pageHref: string
): HeatmapCell[] {
  if (!pageHref) return cells;
  return cells.filter((c) => urlsMatch(c.url, pageHref));
}

export function getViewportFromEvents(
  events: unknown[],
  pageHref?: string
): { width: number; height: number } {
  const fallback = { width: 1280, height: 720 };
  let match: { width: number; height: number } | null = null;
  let last: { width: number; height: number } | null = null;

  for (const event of events) {
    if (!isRecord(event) || event.type !== RRWEB_META || !isRecord(event.data)) {
      continue;
    }
    const href = typeof event.data.href === "string" ? event.data.href : "";
    const width =
      typeof event.data.width === "number" ? event.data.width : 0;
    const height =
      typeof event.data.height === "number" ? event.data.height : 0;
    if (width <= 0 || height <= 0) continue;
    const dims = { width, height };
    last = dims;
    if (pageHref && href && urlsMatch(href, pageHref)) {
      match = dims;
    }
  }

  return match ?? last ?? fallback;
}

export function heatmapPathLabel(url: string): string {
  try {
    return new URL(url).pathname || url;
  } catch {
    return url.slice(0, 48);
  }
}
