import assert from "node:assert/strict";
import { createServer } from "node:net";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { resolve } from "node:path";
import { SignJWT } from "jose";

async function findFreePort() {
  const probe = createServer();
  await new Promise((resolveListen, reject) => {
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", resolveListen);
  });
  const address = probe.address();
  if (!address || typeof address === "string") throw new Error("Could not allocate a local test port");
  await new Promise((resolveClose, reject) => probe.close((error) => error ? reject(error) : resolveClose()));
  return address.port;
}

const port = await findFreePort();
const baseUrl = `http://127.0.0.1:${port}`;
const testOnlySecret = randomBytes(32).toString("base64url");
const env = { ...process.env, NODE_ENV: "production", HOSTNAME: "127.0.0.1", PORT: String(port), SESSION_SECRET: testOnlySecret, DATABASE_URL: "postgresql://127.0.0.1:1/gin_unavailable_runtime_test" };
delete env.PAYMENT_PROVIDER;
env.APP_URL = baseUrl;

const server = spawn(process.execPath, [resolve("node_modules/next/dist/bin/next"), "start", "-p", String(port)], {
  cwd: process.cwd(),
  env,
  stdio: ["ignore", "pipe", "pipe"],
});
let serverOutput = "";
server.stdout.on("data", (chunk) => { serverOutput = (serverOutput + chunk.toString()).slice(-12_000); });
server.stderr.on("data", (chunk) => { serverOutput = (serverOutput + chunk.toString()).slice(-12_000); });

try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Next.js exited before readiness (${server.exitCode})\n${serverOutput}`);
    try {
      const response = await fetch(`${baseUrl}/robots.txt`, { cache: "no-store" });
      if (response.ok) { ready = true; break; }
    } catch { /* server is still starting */ }
    await delay(500);
  }
  assert.equal(ready, true, `Next.js did not become ready\n${serverOutput}`);

  const token = await new SignJWT({ ver: 0 })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("1")
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(new TextEncoder().encode(testOnlySecret));
  const headers = { "content-type": "application/json", origin: baseUrl, cookie: `gin_session=${token}` };
  const cases = [
    { label: "login", path: "/api/auth/login", body: { username: "test", password: "not-a-real-password" }, cookie: false },
    { label: "register", path: "/api/auth/register", body: {}, cookie: false },
    { label: "admin finance", path: "/api/admin/finance", method: "GET", cookie: true },
    { label: "admin users through requireAdmin", path: "/api/admin/users", method: "GET", cookie: true },
    { label: "admin password change through requireAdmin", path: "/api/auth/change-password", body: {}, cookie: true },
    { label: "profile", path: "/api/profile", method: "GET", cookie: true },
    { label: "checkout", path: "/api/checkout", body: { itemType: "course", itemId: 1, idempotencyKey: "test-idempotency-key-1234" }, cookie: true },
    { label: "storage presign", path: "/api/storage/presign", body: {}, cookie: true },
    { label: "storage complete", path: "/api/storage/complete", body: {}, cookie: true },
    { label: "logout", path: "/api/auth/logout", body: {}, cookie: true },
    { label: "unconfigured payment webhook", path: "/api/webhooks/payments/stripe", body: {}, cookie: false },
  ];

  for (const item of cases) {
    const response = await fetch(`${baseUrl}${item.path}`, {
      method: item.method ?? "POST",
      headers: item.cookie ? headers : { "content-type": "application/json", origin: baseUrl },
      ...(item.method === "GET" ? {} : { body: JSON.stringify(item.body) }),
      redirect: "manual",
      cache: "no-store",
    });
    const responseBody = await response.text();
    assert.equal(response.status, 503, `${item.label} should fail closed with 503, got ${response.status}: ${responseBody}`);
    process.stdout.write(`PASS ${item.label}: HTTP ${response.status}\n`);
  }
} finally {
  server.kill();
  await Promise.race([new Promise((resolveExit) => server.once("exit", resolveExit)), delay(5_000)]);
}
