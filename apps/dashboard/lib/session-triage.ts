import { getClickHouseClient } from "@/lib/clickhouse";

export interface SessionTriageFlags {
  has_console_error: boolean;
  has_rage_click: boolean;
  has_dead_click: boolean;
  has_error_click: boolean;
  has_slow_network: boolean;
  has_network_error: boolean;
  has_slow_lcp: boolean;
}

export type SessionTriageMap = Record<string, SessionTriageFlags>;

const EMPTY_FLAGS: SessionTriageFlags = {
  has_console_error: false,
  has_rage_click: false,
  has_dead_click: false,
  has_error_click: false,
  has_slow_network: false,
  has_network_error: false,
  has_slow_lcp: false,
};

export async function fetchSessionTriage(
  sessionIds: string[]
): Promise<SessionTriageMap> {
  if (sessionIds.length === 0) {
    return {};
  }

  const idList = sessionIds.map((id) => `'${id}'`).join(",");
  const ch = getClickHouseClient();

  const [interactionRows, telemetryRows] = await Promise.all([
    ch
      .query({
        query: `
          SELECT
            toString(session_id) AS session_id,
            countIf(type = 'rage_click') > 0 AS has_rage_click,
            countIf(type = 'dead_click') > 0 AS has_dead_click,
            countIf(type = 'error_click') > 0 AS has_error_click
          FROM sighthog.interactions
          WHERE session_id IN (${idList})
          GROUP BY session_id
        `,
        format: "JSONEachRow",
      })
      .then((r) => r.json() as Promise<Record<string, string | number>[]>),
    ch
      .query({
        query: `
          SELECT
            toString(session_id) AS session_id,
            countIf(type = 'console' AND sub_type = 'error') > 0 AS has_console_error,
            countIf(
              type = 'network'
              AND toFloat64OrZero(JSONExtractString(metadata, 'durationMs')) >= 800
            ) > 0 AS has_slow_network,
            countIf(
              type = 'network'
              AND (
                toUInt16OrZero(JSONExtractString(metadata, 'status')) >= 500
                OR sub_type = 'fetch_error'
              )
            ) > 0 AS has_network_error,
            countIf(
              type = 'vitals'
              AND sub_type = 'LCP'
              AND toFloat64OrZero(JSONExtractString(metadata, 'value')) > 2500
            ) > 0 AS has_slow_lcp
          FROM sighthog.telemetry_logs
          WHERE session_id IN (${idList})
          GROUP BY session_id
        `,
        format: "JSONEachRow",
      })
      .then((r) => r.json() as Promise<Record<string, string | number>[]>),
  ]);

  const map: SessionTriageMap = {};
  for (const id of sessionIds) {
    map[id] = { ...EMPTY_FLAGS };
  }

  for (const row of interactionRows) {
    const id = String(row.session_id);
    if (!map[id]) map[id] = { ...EMPTY_FLAGS };
    map[id].has_rage_click = Number(row.has_rage_click) > 0;
    map[id].has_dead_click = Number(row.has_dead_click) > 0;
    map[id].has_error_click = Number(row.has_error_click) > 0;
  }

  for (const row of telemetryRows) {
    const id = String(row.session_id);
    if (!map[id]) map[id] = { ...EMPTY_FLAGS };
    map[id].has_console_error = Number(row.has_console_error) > 0;
    map[id].has_slow_network = Number(row.has_slow_network) > 0;
    map[id].has_network_error = Number(row.has_network_error) > 0;
    map[id].has_slow_lcp = Number(row.has_slow_lcp) > 0;
  }

  return map;
}

export function sessionHasError(flags: SessionTriageFlags): boolean {
  return (
    flags.has_console_error ||
    flags.has_error_click ||
    flags.has_network_error
  );
}
