#!/bin/bash
set -e

BUCKET="${SEAWEEDFS_BUCKET:-sighthog-replays}"

echo "Waiting for SeaweedFS S3..."
until aws --endpoint-url http://seaweedfs:8333 s3 ls --no-sign-request > /dev/null 2>&1; do
  sleep 2
done

echo "Creating bucket ${BUCKET}..."
aws --endpoint-url http://seaweedfs:8333 s3 mb "s3://${BUCKET}" --no-sign-request 2>/dev/null || true

echo "Bucket ${BUCKET} ready."
