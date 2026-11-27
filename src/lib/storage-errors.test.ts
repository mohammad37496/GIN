import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { DatabaseInitializationError } from "./db";
import { isStorageProviderUnavailableError, mapStorageProviderError } from "./storage-errors";

test("storage errors classify AWS credentials, service responses and network failures", () => {
  assert.equal(isStorageProviderUnavailableError(Object.assign(new Error("credentials unavailable"), { name: "CredentialsProviderError" })), true);
  assert.equal(isStorageProviderUnavailableError(Object.assign(new Error("access denied"), { $metadata: { httpStatusCode: 403 } })), true);
  assert.equal(isStorageProviderUnavailableError(Object.assign(new Error("connection reset"), { code: "ECONNRESET" })), true);
  assert.equal(isStorageProviderUnavailableError(new Error("Vercel OIDC token is unavailable")), true);
});

test("storage errors do not misclassify database initialization or application defects as S3 outages", () => {
  assert.equal(isStorageProviderUnavailableError(new DatabaseInitializationError(new Error("migration failed"))), false);
  assert.equal(isStorageProviderUnavailableError(new Error("unexpected programming error")), false);
  assert.equal(mapStorageProviderError("completion", new Error("unexpected programming error")), null);
});

test("storage provider responses are retryable and diagnostic logs omit raw exception messages", () => {
  const previousError = console.error;
  let logged = "";
  console.error = (...args: unknown[]) => { logged = JSON.stringify(args); };
  try {
    const secretMessage = "s3://private-bucket/sensitive-key?X-Amz-Signature=secret";
    const response = mapStorageProviderError("presign", Object.assign(new Error(secretMessage), {
      name: "AccessDenied",
      $metadata: { httpStatusCode: 403 },
    }));
    assert.equal(response?.status, 503);
    assert.equal(logged.includes(secretMessage), false);
    assert.equal(logged.includes("secret"), false);
  } finally {
    console.error = previousError;
  }
});

test("storage routes preserve unknown errors and create no pending asset when signing fails", () => {
  const presign = readFileSync(new URL("../app/api/storage/presign/route.ts", import.meta.url), "utf8");
  const complete = readFileSync(new URL("../app/api/storage/complete/route.ts", import.meta.url), "utf8");
  assert.ok(presign.indexOf("getSignedUrl(") < presign.indexOf("INSERT INTO stored_assets"));
  assert.match(presign, /mapStorageProviderError\("presign", error\)/);
  assert.doesNotMatch(presign, /catch\s*\{\s*return errorResponse/);
  assert.match(complete, /mapStorageProviderError\("completion", error\)[\s\S]*?throw error/);
  assert.match(complete, /logStorageFailure\("staging_cleanup", error\)/);
  assert.doesNotMatch(complete, /catch\s*\{\s*return errorResponse/);
});
