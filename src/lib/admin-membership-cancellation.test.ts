import assert from "node:assert/strict";
import test from "node:test";
import type { PoolClient } from "pg";
import { cancelAdminMembership } from "./admin-membership-cancellation";

function fakeClient(ownerFound = true) {
  const calls: Array<{ sql: string; params?: unknown[] }> = [];
  const client = {
    async query(sql: string, params?: unknown[]) {
      calls.push({ sql, params });
      if (sql.startsWith("SELECT user_id FROM memberships")) {
        return { rowCount: ownerFound ? 1 : 0, rows: ownerFound ? [{ user_id: "42" }] : [] };
      }
      if (sql.startsWith("SELECT id,user_id,status FROM memberships")) {
        return { rowCount: 1, rows: [{ id: "7", user_id: "42", status: "active" }] };
      }
      return { rowCount: 1, rows: [] };
    },
  };
  return { client: client as unknown as PoolClient, calls };
}

test("admin membership cancellation takes the per-user lock before the membership row lock and reconciles shared entitlements", async () => {
  const { client, calls } = fakeClient();

  const result = await cancelAdminMembership(client, {
    membershipId: 7,
    status: "canceled",
    reason: "Overlap regression",
    actorId: 99,
  });

  assert.deepEqual(result, { id: 7, status: "canceled" });
  const userLockIndex = calls.findIndex(({ sql }) => sql.includes("pg_advisory_xact_lock"));
  const membershipRowLockIndex = calls.findIndex(({ sql }) => sql.startsWith("SELECT id,user_id,status FROM memberships") && sql.includes("FOR UPDATE"));
  assert.ok(userLockIndex >= 0, "membership mutations must acquire the per-user advisory lock");
  assert.ok(membershipRowLockIndex > userLockIndex, "the user lock must be acquired before the membership row lock");
  assert.ok(calls.some(({ sql }) => sql.includes("m.starts_at IS NULL OR m.starts_at<=NOW()")), "entitlement reconciliation must treat NULL starts_at as effective");
  assert.ok(calls.some(({ sql }) => sql.includes("INSERT INTO course_enrollment_events")), "entitlement revocations must use the shared event-recording reconciler");
  assert.ok(calls.some(({ sql }) => sql.includes("INSERT INTO audit_logs")), "admin cancellation must retain its audit record");
});

test("admin membership cancellation does not acquire a lock or mutate when the membership does not exist", async () => {
  const { client, calls } = fakeClient(false);
  const result = await cancelAdminMembership(client, {
    membershipId: 404,
    status: "expired",
    reason: "Missing membership",
    actorId: 99,
  });

  assert.equal(result, null);
  assert.equal(calls.length, 1);
  assert.match(calls[0].sql, /^SELECT user_id FROM memberships/);
});
