import bcrypt from "bcryptjs";
import { z } from "zod";
import { pool, ensureSchema } from "@/lib/db";
import { createSession, requireAdmin } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/http";
import { rejectCrossOriginMutation } from "@/lib/request-security";

const schema = z.object({
  currentPassword: z.string().min(1).max(72).refine((value) => Buffer.byteLength(value, "utf8") <= 72),
  newPassword: z.string().min(14).max(72).refine((value) => Buffer.byteLength(value, "utf8") <= 72, "رمز عبور نباید بیشتر از ۷۲ بایت باشد."),
  confirmPassword: z.string().min(14).max(72).refine((value) => Buffer.byteLength(value, "utf8") <= 72),
}).refine((value) => value.newPassword === value.confirmPassword, {
  path: ["confirmPassword"],
  message: "تکرار رمز عبور جدید مطابقت ندارد.",
}).refine((value) => value.currentPassword !== value.newPassword, {
  path: ["newPassword"],
  message: "رمز عبور جدید باید با رمز فعلی متفاوت باشد.",
});

export async function POST(request: Request) {
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;
  const admin = await requireAdmin();
  if (!admin) return errorResponse("دسترسی غیرمجاز است.", 403);

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message ?? "اطلاعات واردشده معتبر نیست.", 400);

  try {
    await ensureSchema();
    const current = await pool.query(
      "SELECT password_hash, token_version FROM users WHERE id = $1 AND role = 'admin' AND status = 'approved'",
      [admin.id],
    );
    const user = current.rows[0];
    if (!user) return errorResponse("حساب مدیر فعال نیست.", 403);

    const attempts = await pool.query(
      "SELECT attempts, window_started_at FROM admin_password_change_attempts WHERE admin_id = $1",
      [admin.id],
    );
    const attempt = attempts.rows[0];
    if (attempt && Number(attempt.attempts) >= 5 && Date.now() - new Date(attempt.window_started_at).getTime() < 15 * 60 * 1000) {
      return errorResponse("تعداد تلاش‌های ناموفق زیاد است. ۱۵ دقیقه دیگر دوباره تلاش کنید.", 429);
    }

    if (!(await bcrypt.compare(parsed.data.currentPassword, user.password_hash))) {
      await pool.query(
        `INSERT INTO admin_password_change_attempts(admin_id, attempts, window_started_at)
         VALUES($1, 1, NOW())
         ON CONFLICT(admin_id) DO UPDATE SET
           attempts = CASE WHEN admin_password_change_attempts.window_started_at < NOW() - INTERVAL '15 minutes' THEN 1 ELSE admin_password_change_attempts.attempts + 1 END,
           window_started_at = CASE WHEN admin_password_change_attempts.window_started_at < NOW() - INTERVAL '15 minutes' THEN NOW() ELSE admin_password_change_attempts.window_started_at END`,
        [admin.id],
      );
      return errorResponse("رمز عبور فعلی صحیح نیست.", 400);
    }

    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
    const nextVersion = Number(user.token_version) + 1;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const updated = await client.query(
        `UPDATE users SET password_hash = $1, token_version = token_version + 1
         WHERE id = $2 AND role = 'admin' AND status = 'approved' AND token_version = $3
         RETURNING id`,
        [passwordHash, admin.id, Number(user.token_version)],
      );
      if (!updated.rowCount) {
        await client.query("ROLLBACK");
        return errorResponse("اطلاعات حساب هم‌زمان تغییر کرده است؛ دوباره وارد شوید.", 409);
      }
      await client.query("DELETE FROM admin_password_change_attempts WHERE admin_id = $1", [admin.id]);
      await client.query("INSERT INTO audit_logs(actor_id, action, target_user_id) VALUES($1, 'password_changed', $1)", [admin.id]);
      await client.query("COMMIT");
    } catch {
      await client.query("ROLLBACK");
      throw new Error("Password update failed");
    } finally {
      client.release();
    }

    await createSession({ id: admin.id, username: admin.username, role: "admin" }, nextVersion);
    return jsonResponse({ message: "رمز عبور با موفقیت تغییر کرد. نشست‌های قبلی شما باطل شدند." });
  } catch {
    return errorResponse("تغییر رمز عبور در حال حاضر انجام نشد.", 500);
  }
}
