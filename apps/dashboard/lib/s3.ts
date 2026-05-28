import { S3Client } from "@aws-sdk/client-s3";

let client: S3Client | null = null;

export function getS3Client(): S3Client {
  if (!client) {
    client = new S3Client({
      endpoint: process.env.SEAWEEDFS_ENDPOINT ?? "http://localhost:8333",
      region: "us-east-1",
      credentials: {
        accessKeyId: process.env.SEAWEEDFS_ACCESS_KEY ?? "any",
        secretAccessKey: process.env.SEAWEEDFS_SECRET_KEY ?? "any",
      },
      forcePathStyle: true,
    });
  }
  return client;
}

export function getReplayBucket(): string {
  return process.env.SEAWEEDFS_BUCKET ?? "sighthog-replays";
}
