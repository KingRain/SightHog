import { Pool } from "pg";

let pool: Pool | null = null;

export function getPostgresPool(): Pool {
  if (!pool) {
    const connectionString =
      process.env.DATABASE_URL ??
      "postgres://sighthog_user:sighthog_password@localhost:5433/sighthog_metadata?sslmode=disable";
    pool = new Pool({ connectionString });
  }
  return pool;
}
