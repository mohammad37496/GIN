import bcrypt from "bcryptjs";
import { z } from "zod";
import { pool, ensureSchema } from "@/lib/db";
import { errorResponse, jsonResponse } from "@/lib/http";

const schema = z.object({ username: z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9_.-]+$/), password: z.string().min(10).max(72) });

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return errorResponse("نام کاربری باید ۳ تا ۳۲ نویسه و رمز عبور حداقل ۱۰ نویسه باشد.");
    await ensureSchema();
    const { username, password } = parsed.data;
    const hash = await bcrypt.hash(password, 12);
    await pool.query("INSERT INTO users(username, username_normalized, password_hash) VALUES($1,$2,$3)", [username, username.toLowerCase(), hash]);
    return jsonResponse({ message: "درخواست ثبت‌نام شما ثبت شد. پس از تأیید مدیر می‌توانید وارد شوید." }, 201);
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") return errorResponse("این نام کاربری قبلاً ثبت شده است.", 409);
    return errorResponse("ثبت‌نام در حال حاضر انجام نشد.", 500);
  }
}
