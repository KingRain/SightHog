import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getClickHouseClient } from "@/lib/clickhouse";
import { getPostgresPool } from "@/lib/postgres";
import { getReplayBucket, getS3Client } from "@/lib/s3";

export async function clearAllSessionData(): Promise<{
  postgresSessions: number;
  replayObjects: number;
}> {
  const pool = getPostgresPool();

  const countResult = await pool.query<{ count: string }>(
    "SELECT COUNT(*)::text AS count FROM sessions"
  );
  const postgresSessions = Number(countResult.rows[0]?.count ?? 0);

  await pool.query("DELETE FROM sessions");
  await pool.query("DELETE FROM users");

  const ch = getClickHouseClient();
  await ch.command({ query: "TRUNCATE TABLE sighthog.events" });
  await ch.command({ query: "TRUNCATE TABLE sighthog.interactions" });
  await ch.command({ query: "TRUNCATE TABLE sighthog.telemetry_logs" });

  const replayObjects = await clearReplayObjects();

  return { postgresSessions, replayObjects };
}

async function clearReplayObjects(): Promise<number> {
  const client = getS3Client();
  const bucket = getReplayBucket();
  let deleted = 0;
  let continuationToken: string | undefined;

  do {
    const list = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: continuationToken,
      })
    );

    const keys = (list.Contents ?? [])
      .map((item) => item.Key)
      .filter((key): key is string => Boolean(key));

    if (keys.length > 0) {
      await client.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: { Objects: keys.map((Key) => ({ Key })) },
        })
      );
      deleted += keys.length;
    }

    continuationToken = list.IsTruncated
      ? list.NextContinuationToken
      : undefined;
  } while (continuationToken);

  return deleted;
}
