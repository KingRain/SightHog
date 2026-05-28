import { NextResponse } from "next/server";
import { getClickHouseClient } from "@/lib/clickhouse";

export const dynamic = "force-dynamic";

const FUNNEL_STEPS = [
  { key: "funnel_view_product", label: "Viewed Product" },
  { key: "funnel_add_cart", label: "Added to Cart" },
  { key: "funnel_open_checkout", label: "Opened Checkout" },
  { key: "funnel_payment", label: "Completed Payment" },
] as const;

const FUNNEL_EVENT_NAMES = FUNNEL_STEPS.map((s) => s.key);

export interface FunnelStepResult {
  step: string;
  label: string;
  users: number;
  conversionPercent: number;
  dropOffPercent: number;
  isLargestDropOff: boolean;
}

export async function GET() {
  try {
    const chClient = getClickHouseClient();
    const inList = FUNNEL_EVENT_NAMES.map((n) => `'${n}'`).join(", ");

    const query = `
      SELECT
        level,
        count() AS users
      FROM (
        SELECT
          session_id,
          windowFunnel(86400)(
            toUInt64(toUnixTimestamp64Milli(timestamp)),
            event_name = 'funnel_view_product',
            event_name = 'funnel_add_cart',
            event_name = 'funnel_open_checkout',
            event_name = 'funnel_payment'
          ) AS level
        FROM sighthog.events
        WHERE event_name IN (${inList})
        GROUP BY session_id
      )
      GROUP BY level
      ORDER BY level
    `;

    const resultSet = await chClient.query({ query, format: "JSONEachRow" });
    const rows = (await resultSet.json()) as { level: number; users: number }[];

    const levelUsers = new Map<number, number>();
    for (const row of rows) {
      levelUsers.set(Number(row.level), Number(row.users));
    }

    const maxLevel = FUNNEL_STEPS.length;
    const stepCounts: number[] = [];
    for (let step = 1; step <= maxLevel; step += 1) {
      let count = 0;
      for (const [level, users] of Array.from(levelUsers.entries())) {
        if (level >= step) {
          count += users;
        }
      }
      stepCounts.push(count);
    }

    const topCount = stepCounts[0] ?? 0;
    let largestDropIndex = -1;
    let largestDrop = 0;

    const steps: FunnelStepResult[] = FUNNEL_STEPS.map((def, index) => {
      const users = stepCounts[index] ?? 0;
      const conversionPercent =
        topCount > 0 ? Math.round((users / topCount) * 1000) / 10 : 0;
      const prev = stepCounts[index - 1] ?? users;
      const dropOffPercent =
        prev > 0 ? Math.round(((prev - users) / prev) * 1000) / 10 : 0;

      if (index > 0 && dropOffPercent > largestDrop) {
        largestDrop = dropOffPercent;
        largestDropIndex = index;
      }

      return {
        step: def.key,
        label: def.label,
        users,
        conversionPercent,
        dropOffPercent,
        isLargestDropOff: false,
      };
    });

    if (largestDropIndex >= 0) {
      steps[largestDropIndex].isLargestDropOff = true;
    }

    return NextResponse.json({ steps });
  } catch (error) {
    console.error("Failed to fetch funnel analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch funnel analytics" },
      { status: 500 }
    );
  }
}
