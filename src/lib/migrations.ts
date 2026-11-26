import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { Pool } from "pg";

const MIGRATION_LOCK_ID = "8247312901";

export async function runMigrations(pool: Pool): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock($1::bigint)", [MIGRATION_LOCK_ID]);
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(160) PRIMARY KEY,
      checksum VARCHAR(64) NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);

    const directory = path.join(process.cwd(), "migrations");
    const files = (await readdir(directory)).filter((file) => /^\d{4}_[a-z0-9_-]+\.sql$/i.test(file)).sort();
    if (!files.length) throw new Error("No database migrations were found.");

    const migrations = await Promise.all(files.map(async (file) => {
      const sql = await readFile(path.join(directory, file), "utf8");
      return { file, sql, checksum: createHash("sha256").update(sql).digest("hex") };
    }));
    const applied = await client.query("SELECT version,checksum FROM schema_migrations");
    const appliedChecksums = new Map(applied.rows.map((row) => [row.version, row.checksum]));
    const mismatches = migrations.filter(({ file, checksum }) => appliedChecksums.has(file) && appliedChecksums.get(file) !== checksum);

    if (mismatches.length) {
      const baselineMismatch = mismatches.length === 1 && mismatches[0].file === "0001_core.sql";
      const allLaterMigrationsMatch = migrations.slice(1).every(({ file, checksum }) => appliedChecksums.get(file) === checksum);
      if (!baselineMismatch || !allLaterMigrationsMatch) {
        throw new Error(`Applied migration ${mismatches[0].file} was modified; create a new migration instead.`);
      }

      // The original baseline has changed across deployed generations. Reconcile its
      // checksum only after every later migration is confirmed applied byte-for-byte.
      await client.query("UPDATE schema_migrations SET checksum=$1 WHERE version=$2", [mismatches[0].checksum, mismatches[0].file]);
      appliedChecksums.set(mismatches[0].file, mismatches[0].checksum);
    }

    for (const { file, sql, checksum } of migrations) {
      if (appliedChecksums.has(file)) continue;
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations(version,checksum) VALUES($1,$2)", [file, checksum]);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
