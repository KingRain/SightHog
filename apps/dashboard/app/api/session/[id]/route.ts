import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { gunzip } from "zlib";
import { promisify } from "util";
import { hasFullSnapshot, prepareReplayEvents } from "@/lib/replay";
import { getReplayBucket, getS3Client } from "@/lib/s3";

export const dynamic = "force-dynamic";

const gunzipAsync = promisify(gunzip);

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const s3 = getS3Client();
    const bucket = getReplayBucket();
    const key = `${params.id}.json.gz`;

    const response = await s3.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );

    const compressed = await response.Body?.transformToByteArray();
    if (!compressed || compressed.length === 0) {
      return NextResponse.json({ error: "Empty session" }, { status: 404 });
    }

    const decompressed = await gunzipAsync(Buffer.from(compressed));
    const parsed = JSON.parse(decompressed.toString("utf-8"));

    const rawEvents = Array.isArray(parsed) ? parsed : parsed.events ?? [];
    const events = prepareReplayEvents(rawEvents);

    if (events.length === 0) {
      return NextResponse.json({ error: "No replay events" }, { status: 404 });
    }

    return NextResponse.json({
      events,
      hasFullSnapshot: hasFullSnapshot(events),
      eventCount: events.length,
    });
  } catch (error) {
    console.error("Failed to fetch session replay:", error);
    return NextResponse.json(
      { error: "Session file not found" },
      { status: 404 }
    );
  }
}
