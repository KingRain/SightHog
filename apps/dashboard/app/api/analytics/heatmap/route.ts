import { NextResponse } from "next/server";
import { getClickHouseClient } from "@/lib/clickhouse";
import type { HeatmapCell, HeatmapData } from "@/lib/heatmap";

export const dynamic = "force-dynamic";

export type { HeatmapCell };

export interface HeatmapResponse extends HeatmapData {
  topUrl: string | null;
}

export async function GET() {
  try {
    const ch = getClickHouseClient();
    const query = `
      SELECT
        url,
        toUInt16(floor(x / 40) * 40) AS x_bin,
        toUInt16(floor(y / 40) * 40) AS y_bin,
        count() AS clicks
      FROM sighthog.interactions
      WHERE type IN ('click', 'rage_click', 'dead_click', 'error_click')
        AND x > 0 AND y > 0
      GROUP BY url, x_bin, y_bin
      ORDER BY clicks DESC
      LIMIT 800
    `;

    const result = await ch.query({ query, format: "JSONEachRow" });
    const raw = (await result.json()) as {
      url: string;
      x_bin: number;
      y_bin: number;
      clicks: string;
    }[];

    const cells: HeatmapCell[] = raw.map((row) => ({
      url: row.url,
      x: Number(row.x_bin),
      y: Number(row.y_bin),
      clicks: Number(row.clicks),
    }));

    const maxClicks = cells.reduce((max, c) => Math.max(max, c.clicks), 0);
    const topUrl = cells[0]?.url ?? null;

    return NextResponse.json({
      cells,
      maxClicks,
      topUrl,
    } satisfies HeatmapResponse);
  } catch (error) {
    console.error("Failed to fetch click heatmap:", error);
    return NextResponse.json(
      { error: "Failed to fetch click heatmap" },
      { status: 500 }
    );
  }
}
