import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { gunzip } from "zlib";
import { promisify } from "util";
import { hasFullSnapshot } from "@/lib/replay";
import { getReplayBucket, getS3Client } from "@/lib/s3";

export const dynamic = "force-dynamic";

const gunzipAsync = promisify(gunzip);

async function sessionHasFullSnapshot(sessionId: string): Promise<boolean> {
  const s3 = getS3Client();
  const bucket = getReplayBucket();
  const key = `${sessionId}.json.gz`;

  const response = await s3.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );

  const compressed = await response.Body?.transformToByteArray();
  if (!compressed || compressed.length === 0) {
    return false;
  }

  const decompressed = await gunzipAsync(Buffer.from(compressed));
  const parsed = JSON.parse(decompressed.toString("utf-8"));
  const rawEvents = Array.isArray(parsed) ? parsed : parsed.events ?? [];
  return hasFullSnapshot(rawEvents);
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const hasSnapshot = await sessionHasFullSnapshot(params.id);
    if (!hasSnapshot) {
      return NextResponse.json(
        { ready: false, hasFullSnapshot: false },
        { status: 404 }
      );
    }

    return NextResponse.json({ ready: true, hasFullSnapshot: true });
  } catch {
    return NextResponse.json(
      { ready: false, hasFullSnapshot: false },
      { status: 404 }
    );
  }
}
