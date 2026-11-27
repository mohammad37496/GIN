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

type RateLimitStore = {
  ensureSchema: () => Promise<void>;
  consume: (digest: string, windowSeconds: number) => Promise<number>;
};

export function getTrustedClientIp(request: Request): string {
  // Vercel provides this header separately so a proxy in front of Vercel cannot
  // replace the client identity. Its x-forwarded-for fallback is sanitized by
  // Vercel as well. Other ingress platforms must overwrite/sanitize XFF before
  // forwarding requests; never trust x-real-ip as an alternate client input.
  return request.headers.get("x-vercel-forwarded-for")?.trim()
    || request.headers.get("x-forwarded-for")?.trim()
    || "unknown";
}

const databaseRateLimitStore: RateLimitStore = {
  ensureSchema,
  async consume(digest, windowSeconds) {
    const result = await pool.query(`INSERT INTO api_rate_limits(bucket_key,hits,window_started_at,expires_at)
      VALUES($1,1,NOW(),NOW()+($2::int*INTERVAL '1 second'))
      ON CONFLICT(bucket_key) DO UPDATE SET
        hits=CASE WHEN api_rate_limits.window_started_at <= NOW()-($2::int*INTERVAL '1 second') THEN 1 ELSE api_rate_limits.hits+1 END,
        window_started_at=CASE WHEN api_rate_limits.window_started_at <= NOW()-($2::int*INTERVAL '1 second') THEN NOW() ELSE api_rate_limits.window_started_at END,
        expires_at=NOW()+($2::int*INTERVAL '1 second')
      RETURNING hits`, [digest, windowSeconds]);
    return Number(result.rows[0].hits);
  },
};

export async function enforceRateLimit(
  request: Request,
  bucket: string,
  limit: number,
  windowSeconds: number,
  store: RateLimitStore = databaseRateLimitStore,
) {
  try {
    await store.ensureSchema();
    const address = getTrustedClientIp(request);
    const digest = createHash("sha256").update(`${bucket}\0${address}`).digest("hex");
    const hits = await store.consume(digest, windowSeconds);
    if (hits > limit) return errorResponse("تعداد درخواست‌ها بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.", 429);
    return null;
  } catch (error) {
    console.error("GIN rate-limit storage is unavailable", error);
    // Never bypass a database-backed security limit when its state cannot be checked.
    return errorResponse("سامانه امنیت درخواست موقتاً در دسترس نیست؛ لطفاً بعداً تلاش کنید.", 503);
  }
}
