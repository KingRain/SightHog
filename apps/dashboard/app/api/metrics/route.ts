import { NextResponse } from "next/server";
import { getClickHouseClient } from "@/lib/clickhouse";

export const dynamic = "force-dynamic";

export interface MetricRow {
  event_name: string;
  total_count: number;
  avg_duration: number;
}

export async function GET() {
  try {
    const chClient = getClickHouseClient();
    const query = `
      SELECT
        event_name,
        count() AS total_count,
        avg(metric_value) AS avg_duration
      FROM sighthog.events
      GROUP BY event_name
      ORDER BY total_count DESC
    `;

    const resultSet = await chClient.query({ query, format: "JSONEachRow" });
    const raw = (await resultSet.json()) as MetricRow[];

    const data = raw.map((row) => ({
      event_name: row.event_name,
      total_count: Number(row.total_count),
      avg_duration: Number(row.avg_duration),
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}
