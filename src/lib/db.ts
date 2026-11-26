import { Pool } from "pg";
import bcrypt from "bcryptjs";

const globalForPg = globalThis as unknown as { pool?: Pool; schemaReady?: Promise<void> };

export const pool = globalForPg.pool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 20_000,
  connectionTimeoutMillis: 8_000,
  ...(process.env.DATABASE_URL?.includes("sslmode=require") ? { ssl: { rejectUnauthorized: false } } : {}),
});

if (process.env.NODE_ENV !== "production") globalForPg.pool = pool;

export async function ensureSchema() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  globalForPg.schemaReady ??= pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      username VARCHAR(32) NOT NULL,
      username_normalized VARCHAR(32) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      token_version INTEGER NOT NULL DEFAULT 0,
      role VARCHAR(10) NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
      status VARCHAR(12) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','suspended')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      reviewed_at TIMESTAMPTZ,
      reviewed_by BIGINT REFERENCES users(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS users_status_created_idx ON users(status, created_at DESC);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;
    CREATE TABLE IF NOT EXISTS audit_logs (
      id BIGSERIAL PRIMARY KEY,
      actor_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
      action VARCHAR(40) NOT NULL,
      target_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS admin_password_change_attempts (
      admin_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      attempts INTEGER NOT NULL DEFAULT 0,
      window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `).then(async () => {
    const adminUsername = process.env.BOOTSTRAP_ADMIN_USERNAME?.trim();
    const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD;
    if (adminUsername || adminPassword) {
      if (!adminUsername || !/^[a-zA-Z0-9_.-]{3,32}$/.test(adminUsername) || !adminPassword || adminPassword.length < 14 || adminPassword.length > 72) {
        throw new Error("BOOTSTRAP_ADMIN_USERNAME and BOOTSTRAP_ADMIN_PASSWORD must both be set; username must be 3-32 allowed characters and password 14-72 characters.");
      }
      const existingAdmin = await pool.query("SELECT 1 FROM users WHERE role = 'admin' LIMIT 1");
      if (existingAdmin.rowCount === 0) {
        const hash = await bcrypt.hash(adminPassword, 12);
        const created = await pool.query(`INSERT INTO users(username, username_normalized, password_hash, role, status)
          VALUES($1,$2,$3,'admin','approved') ON CONFLICT(username_normalized) DO NOTHING RETURNING id`, [adminUsername, adminUsername.toLowerCase(), hash]);
        if (created.rowCount === 0) throw new Error("Bootstrap admin username already belongs to another account. Choose a different username.");
      }
    }
  }).catch((error) => {
    globalForPg.schemaReady = undefined;
    throw error;
  });
  await globalForPg.schemaReady;
}
