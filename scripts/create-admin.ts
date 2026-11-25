import "dotenv/config";
import bcrypt from "bcryptjs";
import { pool, ensureSchema } from "../src/lib/db";

async function main() {
  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !/^[a-zA-Z0-9_.-]{3,32}$/.test(username) || !password || password.length < 14 || password.length > 72) {
    throw new Error("Set ADMIN_USERNAME (3-32 allowed characters) and ADMIN_PASSWORD (14-72 characters) before running db:admin.");
  }
  await ensureSchema();
  const hash = await bcrypt.hash(password, 12);
  await pool.query(`INSERT INTO users(username, username_normalized, password_hash, role, status)
    VALUES($1,$2,$3,'admin','approved')`, [username, username.toLowerCase(), hash]);
  console.log(`Admin account '${username}' is ready.`);
  await pool.end();
}

main().catch(async (error) => { console.error(error instanceof Error ? error.message : "Admin setup failed"); await pool.end(); process.exitCode = 1; });
