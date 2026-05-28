import { NextRequest, NextResponse } from "next/server";
import { getPostgresPool } from "@/lib/postgres";
import {
  fetchSessionTriage,
  sessionHasError,
  type SessionTriageFlags,
} from "@/lib/session-triage";

export const dynamic = "force-dynamic";

export interface SessionListRow {
  id: string;
  user_id: string | null;
  initial_url: string;
  country: string | null;
  browser: string | null;
  os: string | null;
  created_at: string;
  updated_at: string;
  triage: SessionTriageFlags;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const country = searchParams.get("country")?.trim() ?? "";
    const browser = searchParams.get("browser")?.trim() ?? "";
    const hasError = searchParams.get("hasError") === "true";
    const hasRage = searchParams.get("hasRage") === "true";
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit") ?? 50))
    );

    const pool = getPostgresPool();
    const conditions: string[] = [];
    const values: (string | number)[] = [];
    let paramIndex = 1;

    if (q) {
      conditions.push(
        `(initial_url ILIKE $${paramIndex} OR id::text ILIKE $${paramIndex})`
      );
      values.push(`%${q}%`);
      paramIndex += 1;
    }
    if (country) {
      conditions.push(`country = $${paramIndex}`);
      values.push(country);
      paramIndex += 1;
    }
    if (browser) {
      conditions.push(`browser = $${paramIndex}`);
      values.push(browser);
      paramIndex += 1;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    values.push(limit);
    const limitParam = paramIndex;

    const result = await pool.query<{
      id: string;
      user_id: string | null;
      initial_url: string;
      country: string | null;
      browser: string | null;
      os: string | null;
      created_at: string;
      updated_at: string;
    }>(
      `
      SELECT id, user_id, initial_url, country, browser, os, created_at, updated_at
      FROM sessions
      ${whereClause}
      ORDER BY updated_at DESC
      LIMIT $${limitParam}
    `,
      values
    );

    const ids = result.rows.map((r) => r.id);
    const triageMap = await fetchSessionTriage(ids);

    let rows: SessionListRow[] = result.rows.map((row) => ({
      ...row,
      triage: triageMap[row.id] ?? {
        has_console_error: false,
        has_rage_click: false,
        has_dead_click: false,
        has_error_click: false,
        has_slow_network: false,
        has_network_error: false,
        has_slow_lcp: false,
      },
    }));

    if (hasError) {
      rows = rows.filter((r) => sessionHasError(r.triage));
    }
    if (hasRage) {
      rows = rows.filter((r) => r.triage.has_rage_click);
    }

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Failed to fetch sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}
