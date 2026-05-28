import { NextResponse } from "next/server";
import { getPostgresPool } from "@/lib/postgres";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const pool = getPostgresPool();
    const result = await pool.query(
      `
      SELECT id, user_id, initial_url, user_agent, client_ip, created_at, updated_at
      FROM sessions
      WHERE id = $1
      LIMIT 1
    `,
      [params.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Failed to fetch session meta:", error);
    return NextResponse.json(
      { error: "Failed to fetch session meta" },
      { status: 500 }
    );
  }
}
