import assert from "node:assert/strict";
import test from "node:test";
import type { PoolClient } from "pg";
import { grantAdminMembership } from "./admin-membership-grant";

function fakeClient(memberStatus = "approved") {
  const calls: Array<{ sql: string; params?: unknown[] }> = [];
  const client = {
    async query(sql: string, params?: unknown[]) {
      calls.push({ sql, params });
      if (sql.startsWith("SELECT id,status FROM users")) return { rowCount: 1, rows: [{ id: "42", status: memberStatus }] };
      if (sql.startsWith("SELECT id FROM membership_plans")) return { rowCount: 1, rows: [{ id: "9" }] };
      if (sql.startsWith("SELECT id FROM memberships")) return { rowCount: 0, rows: [] };
      if (sql.startsWith("INSERT INTO memberships")) return { rowCount: 1, rows: [{ id: 17, status: "active", starts_at: new Date(), ends_at: null }] };
      return { rowCount: 1, rows: [] };
    },
  };
  return { client: client as unknown as PoolClient, calls };
}

test("admin membership grant takes the shared per-user lock before locking or mutating membership state", async () => {
  const { client, calls } = fakeClient();
  const result = await grantAdminMembership(client, {
    userId: 42,
    planId: 9,
    startsAt: new Date(Date.now() - 1_000),
    endsAt: null,
    actorId: 99,
    reason: "Shared lock regression",
  });

  assert.ok("membership" in result);
  assert.equal(result.membership.id, 17);
  const lockIndex = calls.findIndex(({ sql }) => sql.includes("pg_advisory_xact_lock"));
  const userRowLockIndex = calls.findIndex(({ sql }) => sql.startsWith("SELECT id,status FROM users") && sql.includes("FOR UPDATE"));
  const membershipInsertIndex = calls.findIndex(({ sql }) => sql.startsWith("INSERT INTO memberships"));
  assert.ok(lockIndex >= 0, "membership grants must acquire the per-user advisory lock");
  assert.ok(userRowLockIndex > lockIndex, "the shared user lock must precede the user row lock");
  assert.ok(membershipInsertIndex > userRowLockIndex, "membership creation must happen after the user lock");
  assert.ok(calls.some(({ sql }) => sql.includes("INSERT INTO audit_logs")), "manual grants must retain their audit record");
  assert.ok(calls.some(({ sql }) => sql.includes("INSERT INTO notifications")), "manual grants must retain their member notification");
});

test("admin membership grant fails closed for an unapproved or missing member before reading the plan", async () => {
  const { client, calls } = fakeClient("pending");
  const result = await grantAdminMembership(client, {
    userId: 42,
    planId: 9,
    startsAt: new Date(),
    endsAt: null,
    actorId: 99,
    reason: "Unapproved member",
  });

  assert.deepEqual(result, { member: false });
  assert.ok(calls.some(({ sql }) => sql.includes("pg_advisory_xact_lock")));
  assert.equal(calls.some(({ sql }) => sql.startsWith("SELECT id FROM membership_plans")), false);
});
