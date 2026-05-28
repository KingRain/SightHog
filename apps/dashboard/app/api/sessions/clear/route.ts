import { NextResponse } from "next/server";
import { clearAllSessionData } from "@/lib/clear-session-data";

export const dynamic = "force-dynamic";

export async function DELETE() {
  try {
    const result = await clearAllSessionData();
    return NextResponse.json({
      ok: true,
      deletedSessions: result.postgresSessions,
      deletedReplayObjects: result.replayObjects,
    });
  } catch (error) {
    console.error("Failed to clear session data:", error);
    return NextResponse.json(
      { error: "Failed to clear session data" },
      { status: 500 }
    );
  }
}
