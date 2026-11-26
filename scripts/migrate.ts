import "dotenv/config";
import { ensureSchema, pool } from "@/lib/db";

try {
  await ensureSchema();
  const result = await pool.query("SELECT version,applied_at FROM schema_migrations ORDER BY version");
  for (const migration of result.rows) console.log(`${migration.version}\t${new Date(migration.applied_at).toISOString()}`);
  console.log(`Applied ${result.rowCount} database migrations.`);
} catch (error) {
  console.error("Database migration failed.", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
