import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";
import pg from "pg";
import { lockMembershipUser } from "../src/lib/membership.ts";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required for the PostgreSQL membership-lock regression");

const pool = new pg.Pool({ connectionString, max: 2 });
const userId = 424242;
const first = await pool.connect();
const second = await pool.connect();
let firstTransactionOpen = false;
let secondTransactionOpen = false;

try {
  await first.query("BEGIN");
  firstTransactionOpen = true;
  await lockMembershipUser(first, userId);

  await second.query("BEGIN");
  secondTransactionOpen = true;
  let secondAcquired = false;
  let secondError;
  const secondLock = lockMembershipUser(second, userId).then(
    () => { secondAcquired = true; },
    (error) => { secondError = error; },
  );

  await delay(250);
  assert.equal(secondError, undefined, "the competing PostgreSQL lock request must not fail");
  assert.equal(secondAcquired, false, "a second transaction for the same user must wait while the first transaction holds the advisory lock");

  await first.query("COMMIT");
  firstTransactionOpen = false;
  await secondLock;
  assert.equal(secondAcquired, true, "the waiting transaction must acquire the same per-user lock after release");

  await second.query("ROLLBACK");
  secondTransactionOpen = false;
  process.stdout.write("PostgreSQL per-user membership advisory lock serialized two independent transactions.\n");
} finally {
  if (firstTransactionOpen) await first.query("ROLLBACK").catch(() => undefined);
  if (secondTransactionOpen) await second.query("ROLLBACK").catch(() => undefined);
  first.release();
  second.release();
  await pool.end();
}
