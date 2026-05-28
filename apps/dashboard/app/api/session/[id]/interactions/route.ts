import { NextResponse } from "next/server";
import { getClickHouseClient } from "@/lib/clickhouse";

export const dynamic = "force-dynamic";

interface InteractionRow {
  type: string;
  x: number;
  y: number;
  target: string;
  timestamp: string;
}

export interface SessionInteraction {
  type: string;
  x: number;
  y: number;
  target: string;
  timestamp: number;
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
        x,
        y,
        target,
        toUnixTimestamp64Milli(timestamp) AS timestamp
      FROM sighthog.interactions
      WHERE session_id = {sessionId:UUID}
      ORDER BY timestamp ASC
    `;

    const resultSet = await chClient.query({
      query,
      query_params: { sessionId },
      format: "JSONEachRow",
    });

    const raw = (await resultSet.json()) as InteractionRow[];

    const interactions: SessionInteraction[] = raw.map((row) => ({
      type: row.type,
      x: Number(row.x),
      y: Number(row.y),
      target: row.target,
      timestamp: Number(row.timestamp),
    }));

    return NextResponse.json({ interactions });
  } catch (error) {
    console.error("Failed to fetch session interactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch session interactions" },
      { status: 500 }
    );
  }
}
