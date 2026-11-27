import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { DatabaseInitializationError } from "@/lib/db";
import { mapWebhookProcessingError } from "./webhook-errors";

test("webhook processing maps database initialization and connectivity failures to retryable 503", () => {
  const migrationFailure = new DatabaseInitializationError(new Error("migration failed"));
  const connectionFailure = Object.assign(new Error("connection refused"), { code: "ECONNREFUSED" });

  assert.equal(mapWebhookProcessingError(migrationFailure)?.status, 503);
  assert.equal(mapWebhookProcessingError(connectionFailure)?.status, 503);
  assert.equal(mapWebhookProcessingError(new Error("DATABASE_URL is not configured"))?.status, 503);
});

test("webhook processing does not disguise application and schema defects as infrastructure outages", () => {
  assert.equal(mapWebhookProcessingError(new Error("unexpected payment state")), null);
  assert.equal(mapWebhookProcessingError(Object.assign(new Error("relation does not exist"), { code: "42P01" })), null);
});

test("webhook route rethrows unknown verification and processing errors after safe diagnostic logging", () => {
  const route = readFileSync(new URL("../../app/api/webhooks/payments/[provider]/route.ts", import.meta.url), "utf8");
  assert.match(route, /logWebhookFailure\("verification", error\)[\s\S]*?throw error/);
  assert.match(route, /const infrastructureError = mapWebhookProcessingError\(error\);[\s\S]*?if \(infrastructureError\) return infrastructureError;[\s\S]*?logWebhookFailure\("processing", error\);[\s\S]*?throw error/);
  assert.doesNotMatch(route, /catch\s*\{\s*return errorResponse/);
});
