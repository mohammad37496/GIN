import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { getStorageConfig } from "./storage";

const environmentKeys = [
  "S3_ENDPOINT",
  "S3_REGION",
  "S3_BUCKET",
  "S3_BUCKET_NAME",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
  "AWS_ROLE_ARN",
  "AWS_REGION",
];

const originalEnvironment = new Map(environmentKeys.map((key) => [key, process.env[key]]));

beforeEach(() => {
  for (const key of environmentKeys) delete process.env[key];
});

afterEach(() => {
  for (const key of environmentKeys) {
    const original = originalEnvironment.get(key);
    if (original === undefined) delete process.env[key];
    else process.env[key] = original;
  }
});

test("storage stays disabled when neither complete credentials path is configured", () => {
  process.env.S3_BUCKET = "gin-media";
  process.env.AWS_ROLE_ARN = "arn:aws:iam::123456789012:role/gin-storage";
  assert.equal(getStorageConfig(), null);
});

test("Liara-compatible S3 settings retain static credentials and path-style addressing", async () => {
  process.env.S3_ENDPOINT = "https://storage.iran.liara.space";
  process.env.S3_REGION = "default";
  process.env.S3_BUCKET = "gin-media";
  process.env.S3_ACCESS_KEY_ID = "integration-access-key";
  process.env.S3_SECRET_ACCESS_KEY = "integration-secret-key";

  const storage = getStorageConfig();
  assert.ok(storage);
  try {
    assert.equal(storage.bucket, "gin-media");
    assert.equal(await storage.client.config.region(), "default");
    assert.equal(storage.client.config.forcePathStyle, true);
  } finally {
    storage.client.destroy();
  }
});

test("Vercel AWS integration settings use short-lived OIDC credentials and the injected bucket", async () => {
  process.env.AWS_ROLE_ARN = "arn:aws:iam::123456789012:role/gin-storage";
  process.env.AWS_REGION = "eu-west-1";
  process.env.S3_BUCKET_NAME = "gin-production-media";

  const storage = getStorageConfig();
  assert.ok(storage);
  try {
    assert.equal(storage.bucket, "gin-production-media");
    assert.equal(await storage.client.config.region(), "eu-west-1");
    assert.equal(storage.client.config.forcePathStyle, false);
    assert.equal(typeof storage.client.config.credentials, "function");
  } finally {
    storage.client.destroy();
  }
});
