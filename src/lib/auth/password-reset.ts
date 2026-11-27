import { createHash, randomBytes } from "node:crypto";
import type { PoolClient } from "pg";

export const PASSWORD_RESET_TTL_MINUTES = 30;

export function createPasswordResetToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashPasswordResetToken(token) };
}

export function hashPasswordResetToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function isPasswordResetTokenFormatValid(token: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(token);
}

export async function issuePasswordResetToken(client: PoolClient, userId: number): Promise<string | null> {
  const account = await client.query("SELECT id FROM users WHERE id=$1 AND status='approved' FOR UPDATE", [userId]);
  if (!account.rowCount) return null;
  const { token, tokenHash } = createPasswordResetToken();
  await client.query(
    "UPDATE user_password_reset_tokens SET consumed_at=NOW() WHERE user_id=$1 AND consumed_at IS NULL",
    [userId],
  );
  await client.query(
    `INSERT INTO user_password_reset_tokens(user_id,token_hash,expires_at)
     VALUES($1,$2,NOW()+($3::int*INTERVAL '1 minute'))`,
    [userId, tokenHash, PASSWORD_RESET_TTL_MINUTES],
  );
  return token;
}

export async function revokePasswordResetToken(client: PoolClient, token: string): Promise<void> {
  if (!isPasswordResetTokenFormatValid(token)) return;
  await client.query(
    "UPDATE user_password_reset_tokens SET consumed_at=NOW() WHERE token_hash=$1 AND consumed_at IS NULL",
    [hashPasswordResetToken(token)],
  );
}

/**
 * Consume a token and rotate the account password/session version in one SQL
 * statement. Concurrent submissions can update at most one password because
 * the token row's consumed_at predicate is part of the atomic UPDATE.
 */
export async function consumePasswordResetToken(
  client: PoolClient,
  token: string,
  passwordHash: string,
): Promise<boolean> {
  if (!isPasswordResetTokenFormatValid(token)) return false;
  const result = await client.query(
    `WITH consumed AS (
       UPDATE user_password_reset_tokens
       SET consumed_at=NOW()
       WHERE token_hash=$1 AND consumed_at IS NULL AND expires_at>NOW()
       RETURNING user_id
     )
     UPDATE users AS account
     SET password_hash=$2, token_version=account.token_version+1
     FROM consumed
     WHERE account.id=consumed.user_id AND account.status='approved'
     RETURNING account.id`,
    [hashPasswordResetToken(token), passwordHash],
  );
  return Number(result.rowCount) === 1;
}
