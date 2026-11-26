import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("logout verifies and revokes the server-side token version before clearing its cookie", () => {
  const auth = readFileSync(new URL("./auth.ts", import.meta.url), "utf8");
  const start = auth.indexOf("export async function revokeCurrentSession");
  const end = auth.indexOf("export async function getSession", start);
  const revoke = auth.slice(start, end);
  const update = revoke.indexOf("UPDATE users SET token_version=token_version+1 WHERE id=$1 AND token_version=$2");
  const finalClear = revoke.lastIndexOf("await clearSession()");

  assert.ok(start >= 0 && end > start, "revokeCurrentSession is exported");
  assert.match(revoke, /jwtVerify\(token, signingKey\)/);
  assert.ok(update >= 0 && finalClear > update, "server-side token revocation succeeds before the browser cookie is cleared");
  assert.match(revoke, /Number\.isSafeInteger\(tokenVersion\)/);
});

test("session secret configuration errors are not swallowed as invalid-token cleanup", () => {
  const auth = readFileSync(new URL("./auth.ts", import.meta.url), "utf8");
  const revokeStart = auth.indexOf("export async function revokeCurrentSession");
  const sessionStart = auth.indexOf("export async function getSession");
  const revoke = auth.slice(revokeStart, sessionStart);
  const session = auth.slice(sessionStart, auth.indexOf("export async function requireAdmin", sessionStart));
  const revokeKey = revoke.indexOf("const signingKey = secret()");
  const revokeCatch = revoke.indexOf("try {");
  const sessionKey = session.indexOf("const signingKey = secret()");
  const sessionCatch = session.indexOf("try {");

  assert.ok(revokeKey >= 0 && revokeKey < revokeCatch, "logout validates its signing key before catching token verification errors");
  assert.ok(sessionKey >= 0 && sessionKey < sessionCatch, "session reads surface signing-key configuration errors");
  assert.match(revoke, /jwtVerify\(token, signingKey\)/);
  assert.match(session, /jwtVerify\(token, signingKey\)/);
});

test("logout rejects cross-origin requests and preserves the English return locale", () => {
  const route = readFileSync(new URL("../app/api/auth/logout/route.ts", import.meta.url), "utf8");
  const staffHeader = readFileSync(new URL("../components/staff-header.tsx", import.meta.url), "utf8");
  assert.ok(route.indexOf("const originError = rejectCrossOriginMutation") < route.indexOf("await revokeCurrentSession()"));
  assert.match(route, /searchParams\.get\("locale"\) === "en" \? "\/en" : "\/"/);
  assert.match(route, /status: 503/);
  assert.match(staffHeader, /href=\{english \? "\/en" : "\/"\}/);
  assert.match(staffHeader, /action=\{`\/api\/auth\/logout\?locale=\$\{locale\}`\}/);
});

test("English logout reports a failed server revocation instead of navigating away", () => {
  const component = readFileSync(new URL("../components/english-member-controls.tsx", import.meta.url), "utf8");
  assert.match(component, /if \(!response\.ok\)/);
  assert.match(component, /setError\(result\.error_en/);
  assert.match(component, /role="alert"/);
  assert.match(component, /api\/auth\/logout\?locale=en/);
});

test("integration verifies authenticated CSRF rejection and replayed logout-token denial", () => {
  const integration = readFileSync(new URL("../../scripts/test-integration.mjs", import.meta.url), "utf8");
  assert.match(integration, /headers: \{ Origin: "https:\/\/attacker\.example" \}/);
  assert.match(integration, /tokenVersionAfterLogout === tokenVersionBeforeLogout \+ 1/);
  assert.match(integration, /replayCookie of \[adminCookie, secondAdminCookie\]/);
  assert.match(integration, /server-side logout revocation and locale-preserving redirect/);
});
