import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("admin password-change rate limit increments atomically before password verification", () => {
  const route = readFileSync(new URL("../app/api/auth/change-password/route.ts", import.meta.url), "utf8");
  const reservation = route.indexOf("INSERT INTO admin_password_change_attempts");
  const verification = route.indexOf("bcrypt.compare(parsed.data.currentPassword");
  assert.ok(reservation >= 0 && verification > reservation, "the attempt slot must be reserved before bcrypt verification");
  assert.match(route, /ON CONFLICT\(admin_id\) DO UPDATE SET/);
  assert.match(route, /RETURNING attempts/);
  assert.match(route, /Number\(attempt\.rows\[0\]\?\.attempts \?\? 0\) > 5/);
  assert.match(route, /clock_timestamp\(\) - INTERVAL '15 minutes'/);
  assert.doesNotMatch(route, /SELECT attempts, window_started_at FROM admin_password_change_attempts/);
});

test("integration suite exercises concurrent password-change attempts while the counter row is locked", () => {
  const integration = readFileSync(new URL("../../scripts/test-integration.mjs", import.meta.url), "utf8");
  assert.match(integration, /concurrentPasswordAttempts = Array\.from\(\{ length: 10 \}/);
  assert.match(integration, /passwordAttemptWaited === true/);
  assert.match(integration, /passwordAttemptStatuses\.filter\(\(status\) => status === 400\)\.length === 5/);
  assert.match(integration, /passwordAttemptStatuses\.filter\(\(status\) => status === 429\)\.length === 5/);
  assert.match(integration, /Admin password-change rate limit resets after its 15-minute window/);
});
