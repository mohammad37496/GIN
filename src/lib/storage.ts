import { S3Client } from "@aws-sdk/client-s3";
import { awsCredentialsProvider } from "@vercel/oidc-aws-credentials-provider";

export type StorageConfig = {
  bucket: string;
  client: S3Client;
};

export function getStorageConfig(): StorageConfig | null {
  const bucket = process.env.S3_BUCKET?.trim() || process.env.S3_BUCKET_NAME?.trim();
  if (!bucket) return null;

  const endpoint = process.env.S3_ENDPOINT?.trim();
  const accessKeyId = process.env.S3_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY?.trim();
  const region = process.env.S3_REGION?.trim() || process.env.AWS_REGION?.trim();

  if (accessKeyId && secretAccessKey) {
    if (!endpoint && !region) return null;
    return {
      bucket,
      client: new S3Client({
        region: region || "default",
        ...(endpoint ? { endpoint } : {}),
        forcePathStyle: Boolean(endpoint),
        credentials: { accessKeyId, secretAccessKey },
      }),
    };
  }

  const roleArn = process.env.AWS_ROLE_ARN?.trim();
  const awsRegion = process.env.AWS_REGION?.trim();
  if (!roleArn || !awsRegion) return null;

  return {
    bucket,
    client: new S3Client({
      region: awsRegion,
      ...(endpoint ? { endpoint } : {}),
      forcePathStyle: Boolean(endpoint),
      credentials: awsCredentialsProvider({ roleArn }),
    }),
  };
}
