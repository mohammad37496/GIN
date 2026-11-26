import { createHash } from "node:crypto";
import { ensureSchema, pool } from "@/lib/db";
import { errorResponse } from "@/lib/http";

export function sameOriginRequest(request: Request): boolean {
  const expected = process.env.APP_URL ? new URL(process.env.APP_URL).origin : new URL(request.url).origin;
  const origin = request.headers.get("origin");
  if (origin) return origin === expected;
  const referer = request.headers.get("referer");
  if (referer) {
    try { return new URL(referer).origin === expected; } catch { return false; }
  }
  return request.headers.get("sec-fetch-site") === "same-origin";
}

export function rejectCrossOriginMutation(request: Request) {
  return sameOriginRequest(request) ? null : errorResponse("درخواست از مبدأ نامعتبر پذیرفته نمی‌شود.", 403);
}

export async function enforceRateLimit(request: Request, bucket: string, limit: number, windowSeconds: number) {
  await ensureSchema();
  const forwarded = request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim();
  const address = request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || forwarded || "unknown";
  const digest = createHash("sha256").update(`${bucket}\0${address}`).digest("hex");
  const result = await pool.query(`INSERT INTO api_rate_limits(bucket_key,hits,window_started_at,expires_at)
    VALUES($1,1,NOW(),NOW()+($2::int*INTERVAL '1 second'))
    ON CONFLICT(bucket_key) DO UPDATE SET
      hits=CASE WHEN api_rate_limits.window_started_at <= NOW()-($2::int*INTERVAL '1 second') THEN 1 ELSE api_rate_limits.hits+1 END,
      window_started_at=CASE WHEN api_rate_limits.window_started_at <= NOW()-($2::int*INTERVAL '1 second') THEN NOW() ELSE api_rate_limits.window_started_at END,
      expires_at=NOW()+($2::int*INTERVAL '1 second')
    RETURNING hits`, [digest, windowSeconds]);
  if (Number(result.rows[0].hits) > limit) return errorResponse("تعداد درخواست‌ها بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.", 429);
  return null;
}
