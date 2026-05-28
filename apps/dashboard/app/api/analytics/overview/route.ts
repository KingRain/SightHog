import { NextResponse } from "next/server";
import { getClickHouseClient } from "@/lib/clickhouse";

export const dynamic = "force-dynamic";

export interface CountryRow {
  country: string;
  visits: number;
}

export interface BreakdownRow {
  name: string;
  count: number;
}

export interface ReferrerRow {
  source: string;
  visits: number;
}

export interface AnalyticsOverview {
  totalPageviews: number;
  uniqueVisitors: number;
  bounceRate: number;
  liveActiveUsers: number;
  topCountries: CountryRow[];
  topBrowsers: BreakdownRow[];
  topOs: BreakdownRow[];
  topReferrers: ReferrerRow[];
}

function normalizeReferrer(referrer: string): string {
  const trimmed = referrer.trim();
  if (!trimmed) return "Direct";
  try {
    const host = new URL(trimmed).hostname.replace(/^www\./, "");
    return host || "Direct";
  } catch {
    return trimmed.slice(0, 80) || "Direct";
  }
}

async function queryJson<T>(query: string): Promise<T[]> {
  const ch = getClickHouseClient();
  const result = await ch.query({ query, format: "JSONEachRow" });
  return (await result.json()) as T[];
}

export async function GET() {
  try {
    const [pageviewRow] = await queryJson<{ total: string }>(`
      SELECT count() AS total
      FROM sighthog.events
      WHERE event_name = 'pageview'
    `);

    const [visitorRow] = await queryJson<{ total: string }>(`
      SELECT uniq(visitor_id) AS total
      FROM sighthog.events
      WHERE visitor_id != ''
    `);

    const [liveRow] = await queryJson<{ total: string }>(`
      SELECT uniq(visitor_id) AS total
      FROM sighthog.events
      WHERE visitor_id != ''
        AND timestamp >= now() - INTERVAL 5 MINUTE
    `);

    const [bounceRow] = await queryJson<{ rate: number }>(`
      SELECT
        if(count() = 0, 0, countIf(pv = 1) / count()) AS rate
      FROM (
        SELECT session_id, count() AS pv
        FROM sighthog.events
        WHERE event_name = 'pageview'
        GROUP BY session_id
      )
    `);

    const topCountries = await queryJson<{ country: string; visits: string }>(`
      SELECT country, count() AS visits
      FROM sighthog.events
      WHERE event_name = 'pageview' AND country != ''
      GROUP BY country
      ORDER BY visits DESC
      LIMIT 10
    `);

    const topBrowsers = await queryJson<{ name: string; count: string }>(`
      SELECT browser AS name, count() AS count
      FROM sighthog.events
      WHERE event_name = 'pageview' AND browser != '' AND browser != 'Unknown'
      GROUP BY browser
      ORDER BY count DESC
      LIMIT 8
    `);

    const topOs = await queryJson<{ name: string; count: string }>(`
      SELECT os AS name, count() AS count
      FROM sighthog.events
      WHERE event_name = 'pageview' AND os != '' AND os != 'Unknown'
      GROUP BY os
      ORDER BY count DESC
      LIMIT 8
    `);

    const referrerRaw = await queryJson<{ referrer: string; visits: string }>(`
      SELECT referrer, count() AS visits
      FROM sighthog.events
      WHERE event_name = 'pageview'
      GROUP BY referrer
      ORDER BY visits DESC
      LIMIT 20
    `);

    const referrerMap = new Map<string, number>();
    for (const row of referrerRaw) {
      const source = normalizeReferrer(row.referrer);
      referrerMap.set(source, (referrerMap.get(source) ?? 0) + Number(row.visits));
    }

    const topReferrers = Array.from(referrerMap.entries())
      .map(([source, visits]) => ({ source, visits }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 10);

    const data: AnalyticsOverview = {
      totalPageviews: Number(pageviewRow?.total ?? 0),
      uniqueVisitors: Number(visitorRow?.total ?? 0),
      bounceRate: Number(bounceRow?.rate ?? 0),
      liveActiveUsers: Number(liveRow?.total ?? 0),
      topCountries: topCountries.map((r) => ({
        country: r.country,
        visits: Number(r.visits),
      })),
      topBrowsers: topBrowsers.map((r) => ({
        name: r.name,
        count: Number(r.count),
      })),
      topOs: topOs.map((r) => ({
        name: r.name,
        count: Number(r.count),
      })),
      topReferrers,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch analytics overview:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics overview" },
      { status: 500 }
    );
  }
}
