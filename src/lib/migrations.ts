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
      // Git may check SQL files out with CRLF on Windows and LF on Linux. Normalize
      // before hashing and execution so the same migration has one stable checksum.
      const rawSql = await readFile(path.join(directory, file), "utf8");
      const sql = rawSql.replace(/\r\n?/g, "\n");
      const checksum = createHash("sha256").update(sql).digest("hex");
      const compatibleChecksums = new Set([
        checksum,
        createHash("sha256").update(rawSql).digest("hex"),
        createHash("sha256").update(sql.replace(/\n/g, "\r\n")).digest("hex"),
      ]);
      return { file, sql, checksum, compatibleChecksums };
    }));
    const applied = await client.query("SELECT version,checksum FROM schema_migrations");
    const appliedChecksums = new Map(applied.rows.map((row) => [row.version, row.checksum]));
    const baseline = migrations[0];
    const appliedLater = migrations.slice(1).filter(({ file }) => appliedChecksums.has(file));
    if (!appliedChecksums.has(baseline.file) && appliedLater.length) {
      throw new Error(`Baseline migration ${baseline.file} is missing from schema_migrations while later migrations are recorded (${appliedLater.map(({ file }) => file).join(", ")}); refusing to reapply the baseline.`);
    }
    const lineEndingMismatches = migrations.filter(({ file, checksum, compatibleChecksums }) =>
      appliedChecksums.has(file) && appliedChecksums.get(file) !== checksum && compatibleChecksums.has(appliedChecksums.get(file))
    );
    for (const { file, checksum } of lineEndingMismatches) {
      await client.query("UPDATE schema_migrations SET checksum=$1 WHERE version=$2", [checksum, file]);
      appliedChecksums.set(file, checksum);
    }

    const mismatches = migrations.filter(({ file, compatibleChecksums }) =>
      appliedChecksums.has(file) && !compatibleChecksums.has(appliedChecksums.get(file))
    );

    if (mismatches.length) {
      const baselineMismatch = mismatches.length === 1 && mismatches[0].file === "0001_core.sql";
      const laterMismatches = migrations.slice(1).filter(({ file, checksum }) => appliedChecksums.has(file) && appliedChecksums.get(file) !== checksum).map(({ file }) => file);
      const laterMissing = migrations.slice(1).filter(({ file }) => !appliedChecksums.has(file)).map(({ file }) => file);
      if (!baselineMismatch || laterMismatches.length > 0) {
        const reasons = [
          laterMismatches.length ? `later checksum mismatch: ${laterMismatches.join(", ")}` : "",
          laterMissing.length ? `later migrations not recorded: ${laterMissing.join(", ")}` : "",
        ].filter(Boolean).join("; ");
        throw new Error(`Applied migration ${mismatches[0].file} was modified; create a new migration instead.${reasons ? ` ${reasons}.` : ""}`);
      }

      // The original baseline has changed across deployed generations. Reconcile its
      // checksum only when every later migration already in the ledger matches. Later
      // migrations absent from the ledger are applied normally by the loop below.
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
