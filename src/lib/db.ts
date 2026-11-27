import { Pool, type PoolClient } from "pg";
import bcrypt from "bcryptjs";
import { runMigrations } from "@/lib/migrations";

const globalForPg = globalThis as unknown as { pool?: Pool; schemaReady?: Promise<void> };

export class DatabaseInitializationError extends Error {
  readonly originalError: unknown;
  constructor(originalError: unknown) {
    super("Database initialization failed");
    this.name = "DatabaseInitializationError";
    this.originalError = originalError;
  }
}

export const pool = globalForPg.pool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 20_000,
  connectionTimeoutMillis: 8_000,
  ...(process.env.DATABASE_URL?.includes("sslmode=require") ? { ssl: { rejectUnauthorized: false } } : {}),
});

export function isDatabaseUnavailableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  if (error instanceof DatabaseInitializationError) return true;
  const candidate = error as { code?: unknown; message?: unknown };
  const code = typeof candidate.code === "string" ? candidate.code : "";
  const message = typeof candidate.message === "string" ? candidate.message.toLowerCase() : "";
  return message.includes("database_url is not configured")
    || code.startsWith("08")
    || ["ECONNREFUSED", "ECONNRESET", "ENOTFOUND", "EHOSTUNREACH", "ETIMEDOUT", "57P01", "57P02", "57P03", "57P04", "53300", "28P01", "3D000", "42501"].includes(code)
    || message.includes("connection terminated")
    || message.includes("connection timeout")
    || message.includes("database initialization failed");
}

if (process.env.NODE_ENV !== "production") globalForPg.pool = pool;

async function bootstrapAdmin() {
  const username = process.env.BOOTSTRAP_ADMIN_USERNAME?.trim();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (!username && !password) return;
  if (!username || !/^[a-zA-Z0-9_.-]{3,32}$/.test(username) || !password || password.length < 14 || Buffer.byteLength(password, "utf8") > 72) {
    throw new Error("BOOTSTRAP_ADMIN_USERNAME and BOOTSTRAP_ADMIN_PASSWORD must both be set; username must be 3-32 allowed characters and password 14-72 bytes.");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(8247312910)");
    const existingAdmin = await client.query("SELECT 1 FROM users WHERE role='admin' LIMIT 1");
    if (existingAdmin.rowCount === 0) {
      const hash = await bcrypt.hash(password, 12);
      const created = await client.query(`INSERT INTO users(username,username_normalized,password_hash,role,status)
        VALUES($1,$2,$3,'admin','approved') ON CONFLICT(username_normalized) DO NOTHING RETURNING id`,
      [username, username.toLowerCase(), hash]);
      if (created.rowCount === 0) throw new Error("Bootstrap admin username already belongs to another account. Choose a different username.");
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function ensureSchema(): Promise<void> {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  globalForPg.schemaReady ??= (async () => {
    await runMigrations(pool);
    await bootstrapAdmin();
  })().catch((error) => {
    console.error("GIN database initialization failed", error);
    globalForPg.schemaReady = undefined;
    throw new DatabaseInitializationError(error);
  });
  await globalForPg.schemaReady;
}

export async function inTransaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
