import bcrypt from "bcryptjs";
import { z } from "zod";
import { ensureSchema, inTransaction, isDatabaseUnavailableError } from "@/lib/db";
import { errorResponse, jsonResponse } from "@/lib/http";
import { enforceRateLimit, rejectCrossOriginMutation } from "@/lib/request-security";
import { consumePasswordResetToken } from "@/lib/auth/password-reset";

const schema = z.object({ token: z.string().min(43).max(43), password: z.string().min(10).max(72), locale: z.enum(["fa", "en"]).default("fa") });

export async function POST(request: Request) {
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  const locale = parsed.success ? parsed.data.locale : "fa";
  const limited = await enforceRateLimit(request, "password-reset-confirm", 10, 900, undefined, locale);
  if (limited) return limited;
  if (!parsed.success) return errorResponse(locale === "en" ? "The reset link or password is invalid." : "پیوند بازیابی یا رمز عبور معتبر نیست.", 400);

  try {
    await ensureSchema();
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const consumed = await inTransaction((client) => consumePasswordResetToken(client, parsed.data.token, passwordHash));
    if (!consumed) return errorResponse(locale === "en" ? "The reset link is invalid or expired." : "پیوند بازیابی نامعتبر یا منقضی شده است.", 400);
    return jsonResponse({ message: locale === "en" ? "Your password has been updated. Please sign in again." : "رمز عبور تغییر کرد. برای ورود دوباره اقدام کنید." });
  } catch (error) {
    console.error("GIN password reset confirmation failed", error);
    return errorResponse(locale === "en" ? "The password could not be updated." : "تغییر رمز عبور در حال حاضر انجام نشد.", isDatabaseUnavailableError(error) ? 503 : 500);
  }
}
