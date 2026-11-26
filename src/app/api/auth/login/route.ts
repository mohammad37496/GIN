import bcrypt from "bcryptjs";
import { z } from "zod";
import { pool, ensureSchema } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/http";

const schema = z.object({ username: z.string().trim().min(1).max(32), password: z.string().min(1).max(72) });

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return errorResponse("نام کاربری یا رمز عبور نامعتبر است.", 400);
    await ensureSchema();
    const result = await pool.query("SELECT id, username, password_hash, role, status, token_version FROM users WHERE username_normalized = $1", [parsed.data.username.toLowerCase()]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(parsed.data.password, user.password_hash))) return errorResponse("نام کاربری یا رمز عبور اشتباه است.", 401);
    if (user.status === "pending") return errorResponse("حساب شما در انتظار تأیید مدیر است.", 403);
    if (user.status !== "approved") return errorResponse("دسترسی این حساب فعال نیست. با مدیر تماس بگیرید.", 403);
    await createSession({ id: Number(user.id), username: user.username, role: user.role }, Number(user.token_version));
    return jsonResponse({ message: "ورود موفق بود.", redirectTo: user.role === "admin" ? "/admin" : "/dashboard" });
  } catch { return errorResponse("ورود در حال حاضر انجام نشد.", 500); }
}
