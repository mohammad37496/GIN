import { z } from "zod";
import { ensureSchema, inTransaction, isDatabaseUnavailableError, pool } from "@/lib/db";
import { getConfiguredEmailProvider } from "@/lib/email/provider";
import { errorResponse, jsonResponse } from "@/lib/http";
import { enforceRateLimit, enforceRateLimitForIdentity, rejectCrossOriginMutation } from "@/lib/request-security";
import { issuePasswordResetToken, revokePasswordResetToken } from "@/lib/auth/password-reset";

const schema = z.object({ email: z.string().trim().email().max(254), locale: z.enum(["fa", "en"]).default("fa") });
const genericMessage = (locale: "fa" | "en") => locale === "en"
  ? "If this address belongs to an active account, reset instructions will be sent when email delivery is configured."
  : "اگر این نشانی به حساب فعالی تعلق داشته باشد، در صورت آماده‌بودن سرویس ایمیل دستورالعمل بازیابی ارسال خواهد شد.";

export async function POST(request: Request) {
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  const locale = parsed.success ? parsed.data.locale : "fa";
  const limited = await enforceRateLimit(request, "password-reset-request", 5, 3600, undefined, locale);
  if (limited) return limited;
  if (!parsed.success) return errorResponse(locale === "en" ? "Enter a valid email address." : "نشانی ایمیل معتبر نیست.", 400);

  const provider = getConfiguredEmailProvider();
  if (!provider) return errorResponse(locale === "en" ? "Password reset email delivery is not configured yet." : "سرویس ارسال ایمیل بازیابی هنوز پیکربندی نشده است.", 503);

  try {
    await ensureSchema();
    const email = parsed.data.email.toLowerCase();
    const identityLimit = await enforceRateLimitForIdentity("password-reset-email", email, 3, 3600, undefined, locale);
    if (identityLimit?.status === 429) return jsonResponse({ message: genericMessage(locale) }, 202);
    if (identityLimit) return identityLimit;

    const result = await pool.query(
      `SELECT u.id,p.email FROM users u JOIN user_profiles p ON p.user_id=u.id
       WHERE LOWER(p.email)=$1 AND p.email_verified_at IS NOT NULL AND u.status='approved' LIMIT 1`,
      [email],
    );
    if (!result.rowCount) return jsonResponse({ message: genericMessage(locale) }, 202);

    const account = result.rows[0];
    const token = await inTransaction((client) => issuePasswordResetToken(client, Number(account.id)));
    if (!token) return jsonResponse({ message: genericMessage(locale) }, 202);
    const origin = new URL(process.env.APP_URL || request.url).origin;
    try {
      await provider.sendPasswordResetEmail({
        to: String(account.email),
        resetUrl: `${origin}/${parsed.data.locale === "en" ? "en/" : ""}reset-password?token=${encodeURIComponent(token)}`,
        expiresInMinutes: 30,
        locale: parsed.data.locale,
      });
    } catch (error) {
      await inTransaction((client) => revokePasswordResetToken(client, token));
      console.error("GIN password reset email delivery failed", error);
      // Keep the response independent of account existence to prevent enumeration.
    }
    return jsonResponse({ message: genericMessage(locale) }, 202);
  } catch (error) {
    console.error("GIN password reset request failed", error);
    return errorResponse(locale === "en" ? "The password reset request could not be completed." : "درخواست بازیابی در حال حاضر انجام نشد.", isDatabaseUnavailableError(error) ? 503 : 500);
  }
}
