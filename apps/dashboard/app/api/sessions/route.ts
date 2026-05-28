import { NextResponse } from "next/server";
import { getPostgresPool } from "@/lib/postgres";

export const dynamic = "force-dynamic";

export interface SessionRow {
  id: string;
  user_id: string | null;
  initial_url: string;
  created_at: string;
  updated_at: string;
}

export async function GET() {
  try {
    const pool = getPostgresPool();
    const result = await pool.query<SessionRow>(`
      SELECT id, user_id, initial_url, created_at, updated_at
      FROM sessions
      ORDER BY updated_at DESC
      LIMIT 50
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Failed to fetch sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}
