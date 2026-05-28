import { NextResponse } from "next/server";
import { getClickHouseClient } from "@/lib/clickhouse";

export const dynamic = "force-dynamic";

const FRUSTRATION_TYPES = ["rage_click", "dead_click", "error_click"];

export interface FrustrationSeriesPoint {
  minute: string;
  count: number;
}

export interface FrustrationUrlRow {
  url: string;
  rage_clicks: number;
  dead_clicks: number;
  error_clicks: number;
  total: number;
}

export async function GET() {
  try {
    const chClient = getClickHouseClient();
    const typeList = FRUSTRATION_TYPES.map((t) => `'${t}'`).join(", ");

    const seriesQuery = `
      SELECT
        formatDateTime(toStartOfMinute(timestamp), '%Y-%m-%d %H:%i') AS minute,
        count() AS count
      FROM sighthog.interactions
      WHERE type IN (${typeList})
      GROUP BY minute
      ORDER BY minute
      LIMIT 120
    `;

    const urlsQuery = `
      SELECT
        url,
        countIf(type = 'rage_click') AS rage_clicks,
        countIf(type = 'dead_click') AS dead_clicks,
        countIf(type = 'error_click') AS error_clicks,
        count() AS total
      FROM sighthog.interactions
      WHERE type IN (${typeList})
      GROUP BY url
      ORDER BY total DESC
      LIMIT 15
    `;

    const [seriesSet, urlsSet] = await Promise.all([
      chClient.query({ query: seriesQuery, format: "JSONEachRow" }),
      chClient.query({ query: urlsQuery, format: "JSONEachRow" }),
    ]);

    const series = (await seriesSet.json()) as FrustrationSeriesPoint[];
    const topUrls = (await urlsSet.json()) as FrustrationUrlRow[];

    return NextResponse.json({
      series: series.map((row) => ({
        minute: row.minute,
        count: Number(row.count),
      })),
      topUrls: topUrls.map((row) => ({
        url: row.url,
        rage_clicks: Number(row.rage_clicks),
        dead_clicks: Number(row.dead_clicks),
        error_clicks: Number(row.error_clicks),
        total: Number(row.total),
      })),
    });
  } catch (error) {
    console.error("Failed to fetch frustration analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch frustration analytics" },
      { status: 500 }
    );
  }
}
