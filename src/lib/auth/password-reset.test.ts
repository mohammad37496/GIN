import assert from "node:assert/strict";
import test from "node:test";
import {
  createPasswordResetToken,
  hashPasswordResetToken,
  isPasswordResetTokenFormatValid,
  PASSWORD_RESET_TTL_MINUTES,
  issuePasswordResetToken,
  consumePasswordResetToken,
} from "./password-reset";
import { getConfiguredEmailProvider } from "@/lib/email/provider";

test("password reset tokens are cryptographically random, URL-safe, and stored as SHA-256 digests", () => {
  const first = createPasswordResetToken();
  const second = createPasswordResetToken();
  assert.equal(isPasswordResetTokenFormatValid(first.token), true);
  assert.equal(first.token.length, 43);
  assert.equal(first.tokenHash, hashPasswordResetToken(first.token));
  assert.match(first.tokenHash, /^[a-f0-9]{64}$/);
  assert.notEqual(first.token, first.tokenHash);
  assert.notEqual(first.token, second.token);
  assert.equal(isPasswordResetTokenFormatValid("not-a-reset-token"), false);
  assert.equal(PASSWORD_RESET_TTL_MINUTES, 30);
});

test("issuing a password reset token invalidates previous unconsumed tokens and stores only its hash", async () => {
  const statements: Array<{ sql: string; values: unknown[] }> = [];
  const client = { query: async (sql: string, values: unknown[] = []) => {
    statements.push({ sql, values });
    return { rowCount: 1, rows: [] };
  } } as never;
  const token = await issuePasswordResetToken(client, 42);
  if (!token) throw new Error("Expected approved account to receive a reset token");
  assert.equal(isPasswordResetTokenFormatValid(token), true);
  assert.match(statements[0].sql, /status='approved' FOR UPDATE/);
  assert.match(statements[1].sql, /SET consumed_at=NOW\(\)[\s\S]*user_id=\$1/);
  assert.match(statements[2].sql, /INSERT INTO user_password_reset_tokens\(user_id,token_hash,expires_at\)/);
  assert.equal(statements[2].values[0], 42);
  assert.equal(statements[2].values[1], hashPasswordResetToken(token));
  assert.notEqual(statements[2].values[1], token);
  assert.equal(statements[2].values[2], PASSWORD_RESET_TTL_MINUTES);
});

test("password reset issuance refuses accounts that are not approved", async () => {
  let queried = false;
  const client = { query: async () => { queried = true; return { rowCount: 0, rows: [] }; } } as never;
  assert.equal(await issuePasswordResetToken(client, 42), null);
  assert.equal(queried, true);
});

test("consuming a reset token is a single-use atomic update that invalidates all old sessions", async () => {
  let observedSql = "";
  let observedValues: unknown[] = [];
  const client = { query: async (sql: string, values: unknown[] = []) => {
    observedSql = sql;
    observedValues = values;
    return { rowCount: 1, rows: [{ id: 42 }] };
  } } as never;
  const token = createPasswordResetToken().token;
  assert.equal(await consumePasswordResetToken(client, token, "bcrypt-hash"), true);
  assert.match(observedSql, /consumed_at=NOW\(\)/);
  assert.match(observedSql, /consumed_at IS NULL AND expires_at>NOW\(\)/);
  assert.match(observedSql, /token_version=account\.token_version\+1/);
  assert.match(observedSql, /account\.status='approved'/);
  assert.equal(observedValues[0], hashPasswordResetToken(token));
  assert.equal(observedValues[1], "bcrypt-hash");
});

test("invalid tokens are rejected without querying the database", async () => {
  let queried = false;
  const client = { query: async () => { queried = true; return { rowCount: 1, rows: [] }; } } as never;
  assert.equal(await consumePasswordResetToken(client, "invalid", "hash"), false);
  assert.equal(queried, false);
});

test("no transactional email provider is enabled without explicit configuration", () => {
  assert.equal(getConfiguredEmailProvider(), null);
});
