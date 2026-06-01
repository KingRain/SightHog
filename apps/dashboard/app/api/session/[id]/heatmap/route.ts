import { NextResponse } from "next/server";
import { getClickHouseClient } from "@/lib/clickhouse";
import type { HeatmapCell, HeatmapData } from "@/lib/heatmap";

export const dynamic = "force-dynamic";

export type SessionHeatmapResponse = HeatmapData;

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await context.params;

  if (!sessionId) {
    return NextResponse.json({ error: "Session ID required" }, { status: 400 });
  }

  const urlFilter = new URL(request.url).searchParams.get("url")?.trim();

  try {
    const ch = getClickHouseClient();
    const query = `
      SELECT
        url,
        toUInt16(floor(x / 40) * 40) AS x_bin,
        toUInt16(floor(y / 40) * 40) AS y_bin,
        count() AS clicks
      FROM sighthog.interactions
      WHERE session_id = {sessionId:UUID}
        AND type IN ('click', 'rage_click', 'dead_click', 'error_click')
        AND x > 0 AND y > 0
        ${urlFilter ? "AND url = {url:String}" : ""}
      GROUP BY url, x_bin, y_bin
      ORDER BY clicks DESC
      LIMIT 500
    `;

    const result = await ch.query({
      query,
      query_params: urlFilter
        ? { sessionId, url: urlFilter }
        : { sessionId },
      format: "JSONEachRow",
    });

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

    return NextResponse.json({ cells, maxClicks } satisfies SessionHeatmapResponse);
  } catch (error) {
    console.error("Failed to fetch session heatmap:", error);
    return NextResponse.json(
      { error: "Failed to fetch session heatmap" },
      { status: 500 }
    );
  }
}
