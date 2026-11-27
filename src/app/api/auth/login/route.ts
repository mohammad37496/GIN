import bcrypt from "bcryptjs";
import { z } from "zod";
import { pool, ensureSchema } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/http";
import { enforceRateLimit, rejectCrossOriginMutation } from "@/lib/request-security";
import { getWorkspacePath } from "@/lib/domain";

const schema = z.object({ username: z.string().trim().min(1).max(254), password: z.string().min(1).max(72), remember: z.boolean().optional() });

export async function POST(request: Request) {
  try {
    const originError = rejectCrossOriginMutation(request);
    if (originError) return originError;
    await ensureSchema();
    const rateLimit = await enforceRateLimit(request, "login", 10, 900);
    if (rateLimit) return rateLimit;
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return errorResponse("نام کاربری یا رمز عبور نامعتبر است.", 400);
    const result = await pool.query("SELECT u.id, u.username, u.password_hash, u.role, u.status, u.token_version FROM users u LEFT JOIN user_profiles p ON p.user_id = u.id WHERE u.username_normalized = $1 OR LOWER(p.email) = $1 ORDER BY (u.username_normalized = $1) DESC LIMIT 1", [parsed.data.username.toLowerCase()]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(parsed.data.password, user.password_hash))) return errorResponse("نام کاربری یا رمز عبور اشتباه است.", 401);
    if (user.status === "pending") return errorResponse("حساب شما در انتظار تأیید مدیر است.", 403);
    if (user.status !== "approved") return errorResponse("دسترسی این حساب فعال نیست. با مدیر تماس بگیرید.", 403);
    const roles = await pool.query("SELECT role FROM user_roles WHERE user_id=$1", [user.id]);
    await createSession({ id: Number(user.id), username: user.username, role: user.role }, Number(user.token_version), parsed.data.remember !== false);
    return jsonResponse({ message: "ورود موفق بود.", redirectTo: getWorkspacePath(user.role, roles.rows.map((item) => String(item.role))) });
  } catch (error) { console.error("GIN login request failed", error); return errorResponse("ورود در حال حاضر انجام نشد.", 500); }
}
