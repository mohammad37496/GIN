import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { pool, ensureSchema } from "@/lib/db";

const COOKIE = "gin_session";
function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET must contain at least 32 characters");
  return new TextEncoder().encode(value);
}

export type SessionUser = { id: number; username: string; role: "user" | "admin" };

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ username: user.username, role: user.role })
    .setProtectedHeader({ alg: "HS256" }).setSubject(String(user.id))
    .setIssuedAt().setExpirationTime("7d").sign(secret());
  const jar = await cookies();
  jar.set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
}

export async function clearSession() {
  const jar = await cookies();
  jar.set(COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
}

export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const id = Number(payload.sub);
    if (!Number.isSafeInteger(id)) return null;
    await ensureSchema();
    const result = await pool.query("SELECT id, username, role, status FROM users WHERE id = $1", [id]);
    const user = result.rows[0];
    if (!user || user.status !== "approved") return null;
    return { id: Number(user.id), username: user.username, role: user.role };
  } catch { return null; }
}

export async function requireAdmin() {
  const user = await getSession();
  return user?.role === "admin" ? user : null;
}
