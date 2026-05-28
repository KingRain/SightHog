import { NextResponse } from "next/server";
import { getClickHouseClient } from "@/lib/clickhouse";

export const dynamic = "force-dynamic";

interface TelemetryRow {
  type: string;
  sub_type: string;
  message: string;
  metadata: string;
  timestamp: string;
}

export interface TelemetryLogItem {
  type: "network" | "console" | "vitals";
  subType: string;
  message: string;
  timestamp: number;
  metadata: Record<string, unknown>;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await context.params;

  if (!sessionId) {
    return NextResponse.json({ error: "Session ID required" }, { status: 400 });
  }

  try {
    const chClient = getClickHouseClient();
    const query = `
      SELECT
        type,
        sub_type,
        message,
        metadata,
        toUnixTimestamp64Milli(timestamp) AS timestamp
      FROM sighthog.telemetry_logs
      WHERE session_id = {sessionId:UUID}
      ORDER BY timestamp ASC
    `;

    const resultSet = await chClient.query({
      query,
      query_params: { sessionId },
      format: "JSONEachRow",
    });

    const raw = (await resultSet.json()) as TelemetryRow[];

    const logs: TelemetryLogItem[] = raw.map((row) => {
      let metadata: Record<string, unknown> = {};
      try {
        metadata = JSON.parse(row.metadata) as Record<string, unknown>;
      } catch {
        metadata = {};
      }

      return {
        type: row.type as TelemetryLogItem["type"],
        subType: row.sub_type,
        message: row.message,
        timestamp: Number(row.timestamp),
        metadata,
      };
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Failed to fetch session telemetry:", error);
    return NextResponse.json(
      { error: "Failed to fetch session telemetry" },
      { status: 500 }
    );
  }
}
