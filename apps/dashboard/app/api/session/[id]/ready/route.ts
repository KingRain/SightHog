import { NextResponse } from "next/server";
import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { getReplayBucket, getS3Client } from "@/lib/s3";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const s3 = getS3Client();
    const bucket = getReplayBucket();
    const key = `${params.id}.json.gz`;

    await s3.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );

    return NextResponse.json({ ready: true });
  } catch {
    return NextResponse.json({ ready: false }, { status: 404 });
  }
}
