import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { enforceRateLimit, getTrustedClientIp, rejectCrossOriginMutation, sameOriginRequest } from "./request-security";
import { DatabaseInitializationError, isDatabaseUnavailableError } from "./db";
import { getConfiguredPaymentProvider, InvalidWebhookSignatureError, PaymentProviderUnavailableError } from "./payments/provider";

test("mutation origin checks accept only the configured same origin", () => {
  const previousAppUrl = process.env.APP_URL;
  process.env.APP_URL = "https://gin.example";

  try {
    assert.equal(sameOriginRequest(new Request("https://gin.example/api/profile", {
      method: "PUT",
      headers: { origin: "https://gin.example" },
    })), true);
    assert.equal(sameOriginRequest(new Request("https://gin.example/api/profile", {
      method: "POST",
      headers: { origin: "https://attacker.example" },
    })), false);
    assert.equal(sameOriginRequest(new Request("https://gin.example/api/profile", {
      method: "POST",
      headers: { referer: "https://gin.example/account" },
    })), true);
    assert.equal(sameOriginRequest(new Request("https://gin.example/api/profile", {
      method: "POST",
      headers: { referer: "not a valid URL" },
    })), false);
    assert.equal(sameOriginRequest(new Request("https://gin.example/api/profile", {
      method: "POST",
      headers: { "sec-fetch-site": "same-origin" },
    })), true);
    assert.equal(sameOriginRequest(new Request("https://gin.example/api/profile", {
      method: "POST",
      headers: { "sec-fetch-site": "cross-site" },
    })), false);

    const rejected = rejectCrossOriginMutation(new Request("https://gin.example/api/profile", {
      method: "POST",
      headers: { origin: "https://attacker.example" },
    }));
    assert.equal(rejected?.status, 403);
  } finally {
    if (previousAppUrl === undefined) delete process.env.APP_URL;
    else process.env.APP_URL = previousAppUrl;
  }
});

test("database-backed rate limiting fails closed with 503 when its store is unavailable", async () => {
  const request = new Request("https://gin.example/api/webhooks/payments/stripe", {
    method: "POST",
    headers: { "x-vercel-forwarded-for": "203.0.113.10", "cf-connecting-ip": "198.51.100.10", "x-real-ip": "192.0.2.10" },
  });
  const unavailable = await enforceRateLimit(request, "payment-webhook", 120, 60, {
    ensureSchema: async () => { throw new Error("DATABASE_URL is not configured"); },
    consume: async () => 1,
  });
  assert.equal(unavailable?.status, 503);

  const queryUnavailable = await enforceRateLimit(request, "payment-webhook", 120, 60, {
    ensureSchema: async () => undefined,
    consume: async () => { throw Object.assign(new Error("connection refused"), { code: "ECONNREFUSED" }); },
  });
  assert.equal(queryUnavailable?.status, 503);
});

test("rate limiting uses Vercel's overwritten client-IP header instead of spoofable proxy headers", async () => {
  const request = new Request("https://gin.example/api/auth/login", {
    method: "POST",
    headers: { "x-vercel-forwarded-for": "203.0.113.11", "cf-connecting-ip": "198.51.100.11", "x-real-ip": "192.0.2.11" },
  });
  let observedDigest = "";
  const response = await enforceRateLimit(request, "login", 5, 3600, {
    ensureSchema: async () => undefined,
    consume: async (digest) => { observedDigest = digest; return 1; },
  });
  const expected = createHash("sha256").update("login" + "\0" + "203.0.113.11").digest("hex");
  assert.equal(response, null);
  assert.equal(observedDigest, expected);
});

test("trusted client IP extraction ignores x-real-ip and consistently prefers Vercel's protected header", () => {
  const vercelRequest = new Request("https://gin.example/api/referrals/visit", {
    headers: {
      "x-vercel-forwarded-for": "203.0.113.21",
      "x-forwarded-for": "198.51.100.21",
      "x-real-ip": "192.0.2.21",
    },
  });
  assert.equal(getTrustedClientIp(vercelRequest), "203.0.113.21");

  const sanitizedFallback = new Request("https://gin.example/api/referrals/visit", {
    headers: { "x-forwarded-for": "203.0.113.22, 10.0.0.2", "x-real-ip": "192.0.2.22" },
  });
  assert.equal(getTrustedClientIp(sanitizedFallback), "203.0.113.22, 10.0.0.2");

  const spoofedOnly = new Request("https://gin.example/api/referrals/visit", {
    headers: { "x-real-ip": "192.0.2.23" },
  });
  assert.equal(getTrustedClientIp(spoofedOnly), "unknown");
});

test("referral visit deduplication uses the same trusted client IP source as rate limiting", () => {
  const route = readFileSync(new URL("../app/api/referrals/visit/route.ts", import.meta.url), "utf8");
  assert.match(route, /getTrustedClientIp\(request\)/);
  assert.doesNotMatch(route, /headers\.get\("x-real-ip"\)/);
});

test("rate limiting falls back to the Vercel-sanitized forwarded-for chain and uses a stable unknown bucket when absent", async () => {
  const cases: Array<{ headers: Record<string, string>; address: string }> = [
    { headers: { "x-forwarded-for": "203.0.113.12, 10.0.0.2" }, address: "203.0.113.12, 10.0.0.2" },
    { headers: { "x-vercel-forwarded-for": "", "x-forwarded-for": "" }, address: "unknown" },
    { headers: {}, address: "unknown" },
  ];

  for (const [index, item] of cases.entries()) {
    const request = new Request("https://gin.example/api/auth/login", { method: "POST", headers: item.headers });
    let observedDigest = "";
    const response = await enforceRateLimit(request, `login-fallback-${index}`, 5, 3600, {
      ensureSchema: async () => undefined,
      consume: async (digest) => { observedDigest = digest; return 1; },
    });
    const expected = createHash("sha256").update(`login-fallback-${index}\0${item.address}`).digest("hex");
    assert.equal(response, null);
    assert.equal(observedDigest, expected);
  }
});

test("database outage classification distinguishes connection failures from application errors", () => {
  const previous = process.env.DATABASE_URL;
  try {
    delete process.env.DATABASE_URL;
    assert.equal(isDatabaseUnavailableError(new Error("DATABASE_URL is not configured")), true);
    process.env.DATABASE_URL = "postgresql://example.invalid/gin";
    assert.equal(isDatabaseUnavailableError(Object.assign(new Error("connection refused"), { code: "ECONNREFUSED" })), true);
    assert.equal(isDatabaseUnavailableError(new DatabaseInitializationError(new Error("migration failed"))), true);
    assert.equal(isDatabaseUnavailableError(Object.assign(new Error("unique constraint"), { code: "23505" })), false);
    delete process.env.DATABASE_URL;
    assert.equal(isDatabaseUnavailableError(new Error("unexpected application failure")), false);
  } finally {
    if (previous === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previous;
  }
});

test("payment webhook rejects an unconfigured provider before touching database-backed rate limits", () => {
  const route = readFileSync(new URL("../app/api/webhooks/payments/[provider]/route.ts", import.meta.url), "utf8");
  const providerCheck = route.indexOf("if (!provider || provider.name !== providerName)");
  const rateLimitCheck = route.indexOf("await enforceRateLimit(request, \"payment-webhook\"");
  assert.ok(providerCheck >= 0 && rateLimitCheck > providerCheck);
  assert.match(route, /if \(limited\) return limited/);
  assert.match(route, /if \(!provider \|\| provider\.name !== providerName\) return errorResponse\([^\n]+, 503\)/);
});

test("payment provider distinguishes invalid signatures from retryable infrastructure failures", () => {
  assert.equal(getConfiguredPaymentProvider(), null);
  assert.equal(new InvalidWebhookSignatureError() instanceof Error, true);
  assert.equal(new PaymentProviderUnavailableError() instanceof Error, true);
  const route = readFileSync(new URL("../app/api/webhooks/payments/[provider]/route.ts", import.meta.url), "utf8");
  assert.match(route, /error instanceof InvalidWebhookSignatureError\)[\s\S]*?401/);
  assert.match(route, /error instanceof PaymentProviderUnavailableError\)[\s\S]*?503/);
  assert.match(route, /if \(error instanceof PaymentProviderUnavailableError\) \{[\s\S]*?logWebhookFailure\("verification", error\)[\s\S]*?503/);
  assert.match(route, /logWebhookFailure\("verification", error\);\s*throw error;/);
});
