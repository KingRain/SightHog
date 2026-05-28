import { createClient, type ClickHouseClient } from "@clickhouse/client";

let client: ClickHouseClient | null = null;

export function getClickHouseClient(): ClickHouseClient {
  if (!client) {
    client = createClient({
      url: process.env.CLICKHOUSE_HTTP_URL ?? "http://localhost:8123",
      username: process.env.CLICKHOUSE_USER ?? "default",
      password: process.env.CLICKHOUSE_PASSWORD ?? "password",
      database: process.env.CLICKHOUSE_DATABASE ?? "sighthog",
    });
  }
  return client;
}
