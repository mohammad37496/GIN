import { createHash } from "node:crypto";
import strictAssert from "node:assert/strict";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { spawn, spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import pg from "pg";
import { applyFullRefundEffects } from "../src/lib/payments/refunds.ts";
import { processVerifiedPaymentWebhook } from "../src/lib/payments/webhooks.ts";
import { runMigrations } from "../src/lib/migrations.ts";

const { Pool } = pg;
const root = process.cwd();
const database = await PGlite.create();
const databasePort = Number(process.env.PGLITE_SOCKET_PORT ?? 55432);
if (!Number.isInteger(databasePort) || databasePort < 1024 || databasePort > 65535) {
  throw new Error("PGLITE_SOCKET_PORT must be an integer between 1024 and 65535");
}
const server = new PGLiteSocketServer({ db: database, host: "127.0.0.1", port: databasePort, maxConnections: 8 });
const s3Objects = new Map();
const mutateAfterHead = new Set();
const s3Server = createServer((request, response) => {
  void (async () => {
    const pathParts = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname).split("/").filter(Boolean);
    const bucket = pathParts.shift();
    const key = pathParts.join("/");
    if (bucket !== "integration") { response.writeHead(404); response.end(); return; }
    const metadataFromHeaders = () => Object.fromEntries(Object.entries(request.headers)
      .filter(([name]) => name.startsWith("x-amz-meta-") )
      .map(([name, value]) => [name.slice("x-amz-meta-".length), String(value)]));
    const sendMissing = () => { response.writeHead(404, { "Content-Type": "application/xml" }); response.end("<Error><Code>NoSuchKey</Code></Error>"); };

    if (request.method === "PUT") {
      const copyHeader = request.headers["x-amz-copy-source"];
      if (copyHeader) {
        const sourceParts = decodeURIComponent(String(copyHeader).split("?")[0]).replace(/^\/+/, "").split("/");
        const sourceBucket = sourceParts.shift();
        const sourceKey = sourceParts.join("/");
        const source = sourceBucket === "integration" ? s3Objects.get(sourceKey) : undefined;
        if (!source) { sendMissing(); return; }
        const ifMatch = request.headers["x-amz-copy-source-if-match"];
        if (ifMatch && String(ifMatch) !== source.etag) {
          response.writeHead(412, { "Content-Type": "application/xml" });
          response.end("<Error><Code>PreconditionFailed</Code></Error>");
          return;
        }
        const replaceMetadata = String(request.headers["x-amz-metadata-directive"] || "COPY").toUpperCase() === "REPLACE";
        const copied = {
          body: Buffer.from(source.body),
          contentType: replaceMetadata ? String(request.headers["content-type"] || source.contentType) : source.contentType,
          etag: source.etag,
          metadata: replaceMetadata ? metadataFromHeaders() : { ...source.metadata },
        };
        s3Objects.set(key, copied);
        response.writeHead(200, { "Content-Type": "application/xml" });
        response.end(`<CopyObjectResult><ETag>${copied.etag}</ETag><LastModified>2026-11-26T00:00:00.000Z</LastModified></CopyObjectResult>`);
        return;
      }
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      const body = Buffer.concat(chunks);
      const etag = `"${createHash("md5").update(body).digest("hex")}"`;
      s3Objects.set(key, { body, contentType: String(request.headers["content-type"] || "application/octet-stream"), etag, metadata: metadataFromHeaders() });
      response.writeHead(200, { ETag: etag });
      response.end();
      return;
    }

    if (request.method === "HEAD" || request.method === "GET") {
      const object = s3Objects.get(key);
      if (!object) { sendMissing(); return; }
      const headers = {
        "Content-Length": String(object.body.length),
        "Content-Type": object.contentType,
        ETag: object.etag,
        "Last-Modified": new Date("2026-11-26T00:00:00.000Z").toUTCString(),
        ...Object.fromEntries(Object.entries(object.metadata).map(([name, value]) => [`x-amz-meta-${name}`, value])),
      };
      response.writeHead(200, headers);
      response.end(request.method === "GET" ? object.body : undefined);
      if (request.method === "HEAD" && mutateAfterHead.has(key)) {
        mutateAfterHead.delete(key);
        const replacement = Buffer.alloc(object.body.length, 0x58);
        s3Objects.set(key, { ...object, body: replacement, etag: `"${createHash("md5").update(replacement).digest("hex")}"` });
      }
      return;
    }

    if (request.method === "DELETE") {
      s3Objects.delete(key);
      response.writeHead(204);
      response.end();
      return;
    }

    response.writeHead(501);
    response.end();
  })().catch(() => { if (!response.writableEnded) { if (!response.headersSent) response.writeHead(500); response.end(); } });
});
let app;
let pool;
const integrationPort = Number(process.env.INTEGRATION_PORT ?? 3100);
if (!Number.isInteger(integrationPort) || integrationPort < 1024 || integrationPort > 65535) {
  throw new Error("INTEGRATION_PORT must be an integer between 1024 and 65535");
}
const baseUrl = `http://127.0.0.1:${integrationPort}`;
const origin = baseUrl;
const assert = (condition, message) => { if (!condition) throw new Error(message); };

async function waitForApp() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (app.exitCode !== null) throw new Error(`Next.js exited early (${app.exitCode})`);
    try { const response = await fetch(`${baseUrl}/api/courses`, { signal: AbortSignal.timeout(5000) }); if (response.status < 500) return; } catch { /* server is starting */ }
    await delay(500);
  }
  throw new Error("Next.js did not become ready in time");
}

async function api(path, { method = "GET", body, cookie } = {}) {
  const headers = { Origin: origin, ...(body === undefined ? {} : { "Content-Type": "application/json" }), ...(cookie ? { Cookie: cookie } : {}) };
  const response = await fetch(`${baseUrl}${path}`, { method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }), redirect: "manual", signal: AbortSignal.timeout(15000) });
  const data = await response.json().catch(() => ({}));
  console.log(`${method} ${path} -> ${response.status}`);
  return { response, data, cookie: response.headers.get("set-cookie")?.split(";")[0] };
}

async function runAuthenticatedBrowserQa(routes) {
  if (process.env.GIN_BROWSER_QA !== "1") return;
  const targets = await (await fetch("http://127.0.0.1:9222/json")).json();
  const target = targets.find((item) => item.type === "page");
  if (!target) throw new Error("GIN_BROWSER_QA requires an existing Chrome page on CDP port 9222");
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener("open", resolve, { once: true }); ws.addEventListener("error", reject, { once: true }); });
  let commandId = 0;
  const pending = new Map();
  const requestUrls = new Map();
  const consoleErrors = [];
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.method === "Runtime.exceptionThrown") consoleErrors.push({ kind: "exception", text: message.params.exceptionDetails.text });
    if (message.method === "Log.entryAdded" && message.params.entry.level === "error" && !/ERR_ABORTED/.test(message.params.entry.text)) consoleErrors.push({ kind: "console", text: message.params.entry.text, url: message.params.entry.url || null });
    if (message.method === "Network.requestWillBeSent") requestUrls.set(message.params.requestId, message.params.request.url);
    if (message.method === "Network.responseReceived" && message.params.response.status >= 400) consoleErrors.push({ kind: "http", status: message.params.response.status, url: message.params.response.url });
    if (message.method === "Network.loadingFailed") consoleErrors.push({ kind: "network", errorText: message.params.errorText, url: requestUrls.get(message.params.requestId) || null });
    if (message.id && pending.has(message.id)) { pending.get(message.id)(message); pending.delete(message.id); }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++commandId;
    pending.set(id, (message) => message.error ? reject(new Error(message.error.message)) : resolve(message));
    ws.send(JSON.stringify({ id, method, params }));
  });
  const originalUrl = target.url;
  const results = [];
  const screenshots = [];
  await send("Page.enable"); await send("Runtime.enable"); await send("Log.enable"); await send("Network.enable");
  try {
    for (const width of [1920, 1440, 1366, 1024, 390, 320]) {
      await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: false });
      for (const route of routes) {
        const localeCookie = route.locale === "en" ? "fa" : "en";
        const sessionValue = route.cookie.slice(route.cookie.indexOf("=") + 1);
        await send("Network.setCookie", { name: "gin_session", value: sessionValue, url: baseUrl + "/" });
        await send("Network.setCookie", { name: "gin_locale", value: localeCookie, url: baseUrl + "/" });
        await send("Page.navigate", { url: baseUrl + route.path });
        await delay(1100);
        const evaluated = await send("Runtime.evaluate", { returnByValue: true, expression: "(()=>{const d=document.documentElement;const imgs=[...document.images];const controls=[...document.querySelectorAll('button,input,select,textarea')];const visible=controls.filter(c=>{const r=c.getBoundingClientRect();const s=getComputedStyle(c);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'&&c.getAttribute('aria-hidden')!=='true'&&c.getAttribute('type')!=='hidden';});const names=c=>({aria:c.getAttribute('aria-label'),labelledBy:c.getAttribute('aria-labelledby'),labels:c.labels?[...c.labels].map(l=>(l.textContent||'').trim()).filter(Boolean):[],text:(c.textContent||'').trim(),value:c.value||c.getAttribute('value')||'',title:c.getAttribute('title')||'',placeholder:c.getAttribute('placeholder')||''});const unlabeledControls=visible.filter(c=>{const n=names(c);return !(n.aria?.trim()||n.labelledBy?.trim()||n.labels.length||n.text||n.value||n.title);}).map(c=>({tag:c.tagName.toLowerCase(),type:c.getAttribute('type'),id:c.id,name:c.getAttribute('name'),...names(c),html:c.outerHTML.slice(0,320)}));const canonical=document.querySelector('link[rel=canonical]')?.getAttribute('href')||null;const alternates=[...document.querySelectorAll('link[rel=alternate][hreflang]')].map(a=>({lang:a.getAttribute('hreflang'),href:a.getAttribute('href')}));const jsonLdErrors=[...document.querySelectorAll('script[type=\"application/ld+json\"]')].filter(s=>{try{JSON.parse(s.textContent||'');return false;}catch{return true;}}).length;return {path:location.pathname,lang:d.lang,dir:d.dir,width:innerWidth,docWidth:d.scrollWidth,bodyWidth:document.body.scrollWidth,h1:document.querySelector('h1')?.innerText||document.querySelector('h2')?.innerText||'',canonical,alternates,robots:document.querySelector('meta[name=robots]')?.getAttribute('content')||null,jsonLdErrors,brokenImages:imgs.filter(i=>i.complete&&i.naturalWidth===0).length,missingAlt:imgs.filter(i=>!i.hasAttribute('alt')).length,unlabeledControls};})()" });
        if (evaluated.result?.exceptionDetails) throw new Error(`Browser QA DOM inspection failed at ${route.path}: ${evaluated.result.exceptionDetails.exception?.description || evaluated.result.exceptionDetails.text}`);
        const value = evaluated.result?.result?.value || {};
        results.push({ requestedPath: route.path, expectedPath: route.expectedPath || route.path, expectedLocale: route.locale, width, ...value });
        if (width === 1440 && route.capture) {
          const screenshot = await send("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: false });
          screenshots.push({ name: `${route.capture}-staff-${width}.png`, data: screenshot.result.data });
        }
      }
    }
    const report = { createdAt: new Date().toISOString(), baseUrl, authenticatedWorkspaceQa: true, viewports: [1920, 1440, 1366, 1024, 390, 320], results, consoleErrors };
    const reportPath = "docs/qa-20261126/final/browser-qa-staff-workspaces-20261126.json";
    await writeFile(reportPath, JSON.stringify(report, null, 2), { flag: "w" });
    for (const screenshot of screenshots) await writeFile(`docs/qa-20261126/final/${screenshot.name}`, Buffer.from(screenshot.data, "base64"), { flag: "w" });
    const failures = results.filter((item) => {
      const learnerPage = /\/courses\/[^/]+\/(?:assessments|lessons)\//.test(item.path || "");
      const hasLocaleAlternates = item.alternates?.some((alternate) => alternate.lang === "fa") && item.alternates?.some((alternate) => alternate.lang === "en");
      return item.path !== item.expectedPath || item.lang !== item.expectedLocale || item.dir !== (item.expectedLocale === "en" ? "ltr" : "rtl") || item.docWidth > item.width || item.brokenImages || item.missingAlt || item.unlabeledControls?.length || !item.h1 || item.jsonLdErrors || (learnerPage && (!item.canonical || !hasLocaleAlternates));
    });
    assert(failures.length === 0 && consoleErrors.length === 0, `Authenticated browser QA failed: ${JSON.stringify({ failures, consoleErrors })}`);
    console.log(JSON.stringify({ browserQa: "passed", reportPath, checks: results.length, screenshots: screenshots.map((item) => item.name) }));
  } finally {
    await send("Emulation.clearDeviceMetricsOverride").catch(() => {});
    if (originalUrl && /^https?:/.test(originalUrl)) await send("Page.navigate", { url: originalUrl }).catch(() => {});
    ws.close();
  }
}

async function runVerifiedWebhook(event) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await processVerifiedPaymentWebhook(client, "integration-test", event);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

try {
  await server.start();
  await new Promise((resolve, reject) => { s3Server.once("error", reject); s3Server.listen(0, "127.0.0.1", resolve); });
  const s3Port = s3Server.address().port;
  const databaseUrl = `postgresql://postgres:postgres@${server.getServerConn()}/postgres?sslmode=disable`;
  pool = new Pool({ connectionString: databaseUrl, max: 1 });
  await pool.query("SELECT 1");

  app = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(integrationPort)], {
    cwd: root,
    env: {
      ...process.env,
      NODE_ENV: "production",
      DATABASE_URL: databaseUrl,
      SESSION_SECRET: "integration-test-secret-with-more-than-thirty-two-bytes",
      APP_URL: baseUrl,
      BOOTSTRAP_ADMIN_USERNAME: "integration-admin",
      BOOTSTRAP_ADMIN_PASSWORD: "IntegrationAdmin!Password2026",
      S3_ENDPOINT: `http://127.0.0.1:${s3Port}`,
      S3_BUCKET: "integration",
      S3_ACCESS_KEY_ID: "integration-access-key",
      S3_SECRET_ACCESS_KEY: "integration-secret-key",
    },
    stdio: "inherit",
  });
  await waitForApp();

  const migrationFiles = (await readdir(`${root}/migrations`)).filter((name) => /^\d{4}_[a-z0-9_-]+\.sql$/i.test(name)).sort();
  const lastMigration = migrationFiles.at(-1);
  assert(migrationFiles.includes("0015_immutable_asset_uploads.sql"), "The immutable asset migration is present");
  assert(lastMigration === "0020_payment_webhook_retryable.sql", "The payment webhook retry migration follows the existing bilingual assessment migrations");
  const lastMigrationSql = (await readFile(`${root}/migrations/${lastMigration}`, "utf8")).replace(/\r\n?/g, "\n");
  const lastMigrationChecksum = createHash("sha256").update(lastMigrationSql).digest("hex");
  const baselineMigration = "0001_core.sql";
  const baselineSql = (await readFile(`${root}/migrations/${baselineMigration}`, "utf8")).replace(/\r\n?/g, "\n");
  const baselineChecksum = createHash("sha256").update(baselineSql).digest("hex");

  await runMigrations(pool);
  for (const file of migrationFiles) {
    const sql = (await readFile(`${root}/migrations/${file}`, "utf8")).replace(/\r\n?/g, "\n");
    const crlfChecksum = createHash("sha256").update(sql.replace(/\n/g, "\r\n")).digest("hex");
    await pool.query("UPDATE schema_migrations SET checksum=$1 WHERE version=$2", [crlfChecksum, file]);
  }
  await runMigrations(pool);
  for (const file of migrationFiles) {
    const sql = (await readFile(`${root}/migrations/${file}`, "utf8")).replace(/\r\n?/g, "\n");
    const expectedChecksum = createHash("sha256").update(sql).digest("hex");
    const stored = await pool.query("SELECT checksum FROM schema_migrations WHERE version=$1", [file]);
    assert(stored.rows[0]?.checksum === expectedChecksum, `CRLF checksum for ${file} is reconciled to canonical LF`);
  }

  await pool.query("UPDATE schema_migrations SET checksum=$1 WHERE version=$2", ["legacy-baseline-checksum", baselineMigration]);
  await pool.query("UPDATE schema_migrations SET checksum=$1 WHERE version=$2", ["legacy-last-checksum", lastMigration]);
  await strictAssert.rejects(runMigrations(pool), new RegExp(`Applied migration ${baselineMigration} was modified.*later checksum mismatch: ${lastMigration}`));
  await pool.query("UPDATE schema_migrations SET checksum=$1 WHERE version=$2", [lastMigrationChecksum, lastMigration]);

  await pool.query("DELETE FROM schema_migrations WHERE version=$1", [lastMigration]);
  await runMigrations(pool);
  const reconciledBaseline = await pool.query("SELECT checksum FROM schema_migrations WHERE version=$1", [baselineMigration]);
  assert(reconciledBaseline.rows[0]?.checksum !== "legacy-baseline-checksum", "Baseline checksum is reconciled when later recorded migrations match");
  const restoredLastMigration = await pool.query("SELECT checksum FROM schema_migrations WHERE version=$1", [lastMigration]);
  assert(restoredLastMigration.rows[0]?.checksum === lastMigrationChecksum, "A missing later migration is applied after baseline reconciliation");

  await pool.query("UPDATE schema_migrations SET checksum=$1 WHERE version=$2", ["legacy-last-checksum", lastMigration]);
  await strictAssert.rejects(runMigrations(pool), new RegExp(`Applied migration ${lastMigration} was modified`));
  await pool.query("UPDATE schema_migrations SET checksum=$1 WHERE version=$2", [lastMigrationChecksum, lastMigration]);
  await pool.query("DELETE FROM schema_migrations WHERE version=$1", [baselineMigration]);
  await strictAssert.rejects(runMigrations(pool), new RegExp(`Baseline migration ${baselineMigration} is missing from schema_migrations while later migrations are recorded`));
  await pool.query("INSERT INTO schema_migrations(version,checksum) VALUES($1,$2)", [baselineMigration,baselineChecksum]);
  await runMigrations(pool);
  const storageColumns = await pool.query(`SELECT column_name FROM information_schema.columns
    WHERE table_name='stored_assets' AND column_name=ANY($1::text[])`, [["upload_key","upload_etag","finalizing_at"]]);
  assert(storageColumns.rows.length === 3, "Stored assets include independent upload keys and resumable finalization state");
  const webhookStatusConstraint = await pool.query(`SELECT pg_get_constraintdef(oid) AS definition FROM pg_constraint
    WHERE conrelid='payment_webhook_events'::regclass AND conname='payment_webhook_events_status_check'`);
  assert(webhookStatusConstraint.rows[0]?.definition.includes("retryable"), "Payment webhook events support a retryable state");

  const legacyRoutes = [
    ["/about-us", "/about"],
    ["/contact-us", "/contact"],
    ["/gin-hotels", "/hotels"],
    ["/gin-clubhouses", "/clubhouses"],
    ["/gin-cruise-ship", "/cruise"],
    ["/fa/success-training", "/fa/our-training"],
    ["/fa/training-courses", "/fa/our-training"],
    ["/en/success-training", "/en/our-training"],
    ["/en/training-courses", "/en/our-training"],
  ];
  for (const [path, destination] of legacyRoutes) {
    const response = await fetch(`${baseUrl}${path}`, { redirect: "manual" });
    assert(response.status === 307 && response.headers.get("location") === destination, `Legacy route ${path} redirects to ${destination} (HTTP ${response.status})`);
  }
  const persianReferenceRoutes = [
    ["/our-training", "آموزش‌های GIN"],
    ["/member-benefits-associate", "مزایای عضویت Associate"],
    ["/our-events", "رویدادهای GIN"],
    ["/become-a-member", "عضویت در GIN"],
    ["/personal-mastery", "تسلط فردی"],
    ["/privacy-policy", "سیاست حفظ حریم خصوصی"],
    ["/cookie-policy", "سیاست کوکی"],
    ["/terms-of-use", "شرایط استفاده"],
    ["/member-agreement", "توافق‌نامه اعضا"],
    ["/wealth-creation", "ایجاد ثروت"],
    ["/financial-independence", "استقلال مالی"],
    ["/dynamic-health", "سلامت پویا"],
    ["/happiness", "شادمانی و بهزیستی"],
    ["/global-networking", "شبکه‌سازی جهانی"],
    ["/mentorship", "راهنمایی و منتورینگ"],
    ["/membership-opportunities", "فرصت‌های عضویت"],
  ];
  for (const [path, expectedHeading] of persianReferenceRoutes) {
    const response = await fetch(`${baseUrl}${path}`, { redirect: "manual" });
    const html = await response.text();
    assert(response.status === 200 && html.includes(expectedHeading), `Persian reference route ${path} renders its own page instead of redirecting (HTTP ${response.status})`);
  }
  const englishReferenceRoutes = [
    ["/en/our-training", "Our Training"],
    ["/en/member-benefits-associate", "Associate Member Benefits"],
    ["/en/our-events", "GIN Events"],
    ["/en/become-a-member", "Become a Member"],
    ["/en/personal-mastery", "Personal Mastery"],
    ["/en/privacy-policy", "Privacy Policy"],
    ["/en/cookie-policy", "Cookie Policy"],
    ["/en/terms-of-use", "Terms of Use"],
    ["/en/member-agreement", "Member Agreement"],
    ["/en/wealth-creation", "Wealth Creation"],
    ["/en/financial-independence", "Financial Independence"],
    ["/en/dynamic-health", "Dynamic Health"],
    ["/en/happiness", "Happiness and Well-Being"],
    ["/en/global-networking", "Global Networking"],
    ["/en/mentorship", "Mentorship"],
    ["/en/membership-opportunities", "Membership Opportunities"],
  ];
  for (const [path, expectedHeading] of englishReferenceRoutes) {
    const response = await fetch(`${baseUrl}${path}`, { redirect: "manual" });
    const html = await response.text();
    assert(response.status === 200 && html.includes(expectedHeading), `English reference route ${path} renders its localized page (HTTP ${response.status})`);
  }
  const persianContactResponse = await fetch(`${baseUrl}/fa/contact`);
  const persianContactHtml = await persianContactResponse.text();
  assert(persianContactResponse.status === 200 && persianContactHtml.includes("فرم تماس پورتال آموزشی GIN") && persianContactHtml.includes("جایگزین سامانه تماس رسمی GIN نیست") && persianContactHtml.includes('name="item_6__fluent_sf"') && persianContactHtml.includes('name="country"'), "Persian Contact renders the complete portal-specific contact-submission form without misrepresenting it as the official GIN contact system");
  const persianSupportResponse = await fetch(`${baseUrl}/fa/support`);
  const persianSupportHtml = await persianSupportResponse.text();
  assert(persianSupportResponse.status === 200 && persianSupportHtml.includes("ارسال درخواست پشتیبانی") && persianSupportHtml.includes("next=%2Fsupport"), "Persian Support keeps its separate authenticated support-request form");
  const publicMembershipLevels = await fetch(`${baseUrl}/membership-levels`, { redirect: "manual" });
  assert(publicMembershipLevels.status === 200, `Public membership levels page remains independently accessible (HTTP ${publicMembershipLevels.status})`);

  let result = await api("/api/auth/login", { method: "POST", body: { username: "integration-admin", password: "IntegrationAdmin!Password2026" } });
  assert(result.response.status === 200 && result.cookie, `Admin login should create an HttpOnly session cookie (HTTP ${result.response.status}: ${JSON.stringify(result.data)})`);
  const adminCookie = result.cookie;
  const adminId = Number((await pool.query("SELECT id FROM users WHERE username_normalized='integration-admin'")).rows[0].id);
  await pool.query("DELETE FROM admin_password_change_attempts WHERE admin_id=$1", [adminId]);
  const passwordAttemptLock = await pool.connect();
  await passwordAttemptLock.query("BEGIN");
  await passwordAttemptLock.query(
    `INSERT INTO admin_password_change_attempts(admin_id,attempts,window_started_at)
     VALUES($1,0,clock_timestamp()) ON CONFLICT(admin_id) DO UPDATE SET attempts=0,window_started_at=clock_timestamp()`,
    [adminId],
  );
  await passwordAttemptLock.query("SELECT admin_id FROM admin_password_change_attempts WHERE admin_id=$1 FOR UPDATE", [adminId]);
  const concurrentPasswordAttempts = Array.from({ length: 10 }, () => api("/api/auth/change-password", {
    method: "POST",
    cookie: adminCookie,
    body: { currentPassword: "incorrect-current-password", newPassword: "NewSecurePassphrase!2026", confirmPassword: "NewSecurePassphrase!2026" },
  }));
  const passwordAttemptWaited = await Promise.race([
    Promise.all(concurrentPasswordAttempts).then(() => false),
    new Promise((resolve) => setTimeout(() => resolve(true), 300)),
  ]);
  await passwordAttemptLock.query("COMMIT");
  passwordAttemptLock.release();
  const passwordAttemptResults = await Promise.all(concurrentPasswordAttempts);
  const passwordAttemptStatuses = passwordAttemptResults.map((item) => item.response.status);
  const passwordAttemptCounts = await pool.query("SELECT attempts FROM admin_password_change_attempts WHERE admin_id=$1", [adminId]);
  assert(passwordAttemptWaited === true && passwordAttemptStatuses.filter((status) => status === 400).length === 5 && passwordAttemptStatuses.filter((status) => status === 429).length === 5 && Number(passwordAttemptCounts.rows[0].attempts) === 10,
    "Concurrent admin password-change attempts are atomically limited to five per 15-minute window");
  await pool.query("UPDATE admin_password_change_attempts SET attempts=5,window_started_at=clock_timestamp()-INTERVAL '16 minutes' WHERE admin_id=$1", [adminId]);
  result = await api("/api/auth/change-password", { method: "POST", cookie: adminCookie, body: { currentPassword: "incorrect-current-password", newPassword: "NewSecurePassphrase!2026", confirmPassword: "NewSecurePassphrase!2026" } });
  const resetPasswordAttemptCount = await pool.query("SELECT attempts FROM admin_password_change_attempts WHERE admin_id=$1", [adminId]);
  assert(result.response.status === 400 && Number(resetPasswordAttemptCount.rows[0].attempts) === 1, "Admin password-change rate limit resets after its 15-minute window");
  result = await api("/api/admin/commission-rules", { cookie: adminCookie });
  assert(result.response.status === 200 && Array.isArray(result.data.rules), "Admin can load commission rules without ordering by a nonexistent created_at column");
  for (const [path, locale, direction] of [["/fa/admin", "fa", "rtl"], ["/en/admin", "en", "ltr"]]) {
    const oppositeCookie = locale === "en" ? "fa" : "en";
    const response = await fetch(`${baseUrl}${path}`, { redirect: "manual", headers: { cookie: `${adminCookie}; gin_locale=${oppositeCookie}` } });
    const html = await response.text();
    assert(response.status === 200 && html.includes(`lang="${locale}"`) && html.includes(`dir="${direction}"`) && html.includes("<main"), `Admin workspace ${path} renders in its explicit locale despite an opposing cookie (HTTP ${response.status})`);
  }

  result = await api("/api/admin/courses", { method: "POST", cookie: adminCookie, body: { title: "Integration Course فارسی", titleEn: "Integration Course English", slug: "integration-course", summary: "Integration summary فارسی", summaryEn: "Integration summary English", description: "Integration description فارسی", descriptionEn: "Integration description English", accessType: "free", estimatedMinutes: 10 } });
  assert(result.response.status === 201, `Admin can create course (${result.response.status})`);
  const courseId = Number(result.data.course.id);

  result = await api(`/api/admin/courses/${courseId}/sections`, { method: "POST", cookie: adminCookie, body: { title: "First section فارسی", titleEn: "First section English", descriptionEn: "First section description English" } });
  assert(result.response.status === 201, `Admin can add a course section (HTTP ${result.response.status}: ${JSON.stringify(result.data)})`);
  const sectionId = Number(result.data.section.id);

  result = await api(`/api/admin/sections/${sectionId}/lessons`, { method: "POST", cookie: adminCookie, body: { title: "Preview lesson فارسی", titleEn: "Preview lesson English", summary: "Lesson summary فارسی", summaryEn: "Lesson summary English", content: "Lesson content فارسی", contentEn: "Lesson content English", durationSeconds: 120, isPreview: true, status: "published" } });
  assert(result.response.status === 201, "Admin can publish a lesson");
  const lessonId = Number(result.data.lesson.id);
  result = await api(`/api/admin/courses/${courseId}`, { method: "PATCH", cookie: adminCookie, body: { titleEn: "Updated course title English", summaryEn: "Updated course summary English", descriptionEn: "Updated course description English" } });
  assert(result.response.status === 200 && result.data.course.title_en === "Updated course title English", "Admin can edit course English fields without changing Persian fields");
  result = await api(`/api/admin/sections/${sectionId}`, { method: "PATCH", cookie: adminCookie, body: { titleEn: "Updated section title English", descriptionEn: "Updated section description English" } });
  assert(result.response.status === 200 && result.data.section.title_en === "Updated section title English", "Admin can edit section English fields");
  result = await api(`/api/admin/lessons/${lessonId}`, { method: "PATCH", cookie: adminCookie, body: { titleEn: "Updated lesson title English", summaryEn: "Updated lesson summary English", contentEn: "Updated lesson content English" } });
  assert(result.response.status === 200 && result.data.lesson.content_en === "Updated lesson content English", "Admin can edit lesson English fields");

  result = await api(`/api/admin/courses/${courseId}/assessments`, { method: "POST", cookie: adminCookie, body: { title: "Course knowledge check فارسی", titleEn: "Course knowledge check English", description: "توضیح آزمون فارسی", descriptionEn: "English assessment description", timeLimitSeconds: 600, maxAttempts: 2, passPercent: 70 } });
  assert(result.response.status === 201, `Admin can create an assessment (HTTP ${result.response.status}: ${JSON.stringify(result.data)})`);
  const assessmentId = Number(result.data.assessment.id);
  result = await api(`/api/admin/assessments/${assessmentId}/questions`, { method: "POST", cookie: adminCookie, body: { questionType: "single_choice", prompt: "پرسش فارسی", promptEn: "English question", options: [{ id: "A", label: "گزینه فارسی", label_en: "English option" }], answerKey: "A", explanation: "توضیح پاسخ فارسی", explanationEn: "English explanation", points: 1 } });
  assert(result.response.status === 201, `Admin can create a bilingual single-choice question (HTTP ${result.response.status}: ${JSON.stringify(result.data)})`);
  result = await api(`/api/admin/assessments/${assessmentId}`, { method: "PATCH", cookie: adminCookie, body: { status: "published" } });
  assert(result.response.status === 200, `Assessment publishes after a question exists (HTTP ${result.response.status}: ${JSON.stringify(result.data)})`);
  result = await api(`/api/admin/assessments/${assessmentId}`, { method: "PATCH", cookie: adminCookie, body: { titleEn: "Updated assessment title English", descriptionEn: "Updated assessment description English" } });
  assert(result.response.status === 200 && result.data.assessment.title_en === "Updated assessment title English", "Admin can update assessment English fields after publication");
  result = await api(`/api/admin/assessments/${assessmentId}/questions?questionId=${Number((await pool.query("SELECT id FROM assessment_questions WHERE assessment_id=$1", [assessmentId])).rows[0].id)}`, { method: "PATCH", cookie: adminCookie, body: { promptEn: "Updated English question", explanationEn: "Updated English explanation", optionTranslations: [{ id: "A", labelEn: "Updated English option" }] } });
  assert(result.response.status === 200 && result.data.question.prompt === "پرسش فارسی" && result.data.question.options[0].label === "گزینه فارسی", "Published question translations can be updated while Persian prompt and option labels remain unchanged");
  result = await api(`/api/assessments/${assessmentId}`);
  assert(result.response.status === 401, "Assessment details require an authenticated learner");
  result = await api(`/api/assessments/${assessmentId}`, { cookie: adminCookie });
  assert(result.response.status === 403, "Assessment details require active course enrollment even for a signed-in non-enrolled user");

  result = await api(`/api/admin/courses/${courseId}`, { method: "PATCH", cookie: adminCookie, body: { status: "published" } });
  assert(result.response.status === 200, `Course publishes only after a published lesson exists (HTTP ${result.response.status}: ${JSON.stringify(result.data)})`);
  const englishCoursePage = await fetch(`${baseUrl}/en/courses/integration-course`);
  const englishCourseHtml = await englishCoursePage.text();
  assert(englishCoursePage.status === 200 && englishCourseHtml.includes("Updated course title English") && englishCourseHtml.includes("Updated section title English") && englishCourseHtml.includes("Updated lesson title English") && englishCourseHtml.includes("Updated assessment title English") && englishCourseHtml.includes("Updated assessment description English"), "English course page lists assessments using their English translations");
  assert(!englishCourseHtml.includes("Integration Course فارسی") && !englishCourseHtml.includes("First section فارسی") && !englishCourseHtml.includes("Preview lesson فارسی"), "English course page never falls back to Persian dynamic content");
  const englishLessonPage = await fetch(`${baseUrl}/en/courses/integration-course/lessons/${lessonId}`);
  const englishLessonHtml = await englishLessonPage.text();
  assert(englishLessonPage.status === 200 && englishLessonHtml.includes("Updated lesson content English") && !englishLessonHtml.includes("Lesson content فارسی"), "English lesson page uses only translated lesson content");
  const uploadBytes = Buffer.from("%PDF-1.4\nGIN immutable upload regression\n%%EOF");
  const upload = await api("/api/storage/presign", { method: "POST", cookie: adminCookie, body: { filename: "lesson.pdf", contentType: "application/pdf", size: uploadBytes.length } });
  assert(upload.response.status === 200 && upload.data.uploadUrl, `Instructor can obtain a staging upload URL (HTTP ${upload.response.status}: ${JSON.stringify(upload.data)})`);
  const signedUploadUrl = new URL(upload.data.uploadUrl);
  assert(signedUploadUrl.port === String(s3Port), `Presigned upload URL targets the running S3 test server (${signedUploadUrl.host}, expected port ${s3Port})`);
  const uploadKey = decodeURIComponent(signedUploadUrl.pathname.split("/").slice(2).join("/"));
  const putResponse = await fetch(upload.data.uploadUrl, { method: "PUT", headers: { "Content-Type": "application/pdf" }, body: uploadBytes });
  assert(putResponse.status === 200, `Staging object accepts the initial upload (HTTP ${putResponse.status})`);
  const completions = await Promise.all([
    api("/api/storage/complete", { method: "POST", cookie: adminCookie, body: { assetId: upload.data.assetId } }),
    api("/api/storage/complete", { method: "POST", cookie: adminCookie, body: { assetId: upload.data.assetId } }),
  ]);
  assert(completions.some((item) => item.response.status === 200) && completions.every((item) => item.response.status === 200 || item.response.status === 409), "Concurrent completion requests produce one immutable ready asset without duplicate finalization");
  const storedAsset = await pool.query("SELECT object_key,upload_key,status FROM stored_assets WHERE id=$1", [upload.data.assetId]);
  assert(storedAsset.rows[0].status === "ready" && storedAsset.rows[0].upload_key === uploadKey && storedAsset.rows[0].object_key !== storedAsset.rows[0].upload_key, "The ready asset uses a final object key distinct from its presigned staging key");
  result = await api(`/api/admin/lessons/${lessonId}/resources`, { method: "POST", cookie: adminCookie, body: { assetId: upload.data.assetId, title: "Integration PDF", isDownloadable: true } });
  assert(result.response.status === 201, `A verified immutable asset can be attached to a lesson (HTTP ${result.response.status}: ${JSON.stringify(result.data)})`);
  result = await api(`/api/lessons/${lessonId}/resources`);
  assert(result.response.status === 200 && result.data.resources.length === 1, `Anonymous visitors can read resources attached to a published preview lesson (HTTP ${result.response.status}: ${JSON.stringify(result.data)})`);
  const resourceUrl = result.data.resources[0].url;
  const originalDownload = await fetch(resourceUrl);
  const originalDownloadedBytes = Buffer.from(await originalDownload.arrayBuffer());
  assert(originalDownload.status === 200 && originalDownloadedBytes.equals(uploadBytes), "The lesson resource downloads the verified final object bytes");
  const replayBytes = Buffer.alloc(uploadBytes.length, 0x58);
  const replayResponse = await fetch(upload.data.uploadUrl, { method: "PUT", headers: { "Content-Type": "application/pdf" }, body: replayBytes });
  assert(replayResponse.status === 200, "A still-valid presigned URL can only rewrite the isolated staging object");
  const replayedDownload = await fetch(resourceUrl);
  const replayedDownloadedBytes = Buffer.from(await replayedDownload.arrayBuffer());
  assert(replayedDownload.status === 200 && replayedDownloadedBytes.equals(uploadBytes), "Replaying the original upload URL cannot alter the published lesson resource");
  result = await api("/api/storage/complete", { method: "POST", cookie: adminCookie, body: { assetId: upload.data.assetId } });
  assert(result.response.status === 200 && result.data.status === "ready", "Repeated completion remains idempotent after the asset is ready");
  assert(!s3Objects.has(uploadKey), "A repeated completion removes any staging object recreated by a replay");

  const racingBytes = Buffer.from("%PDF-1.4\nGIN race guard\n%%EOF");
  const racingUpload = await api("/api/storage/presign", { method: "POST", cookie: adminCookie, body: { filename: "race.pdf", contentType: "application/pdf", size: racingBytes.length } });
  assert(racingUpload.response.status === 200, "A second upload can be staged for the ETag race regression");
  const racingKey = decodeURIComponent(new URL(racingUpload.data.uploadUrl).pathname.split("/").slice(2).join("/"));
  const racingPut = await fetch(racingUpload.data.uploadUrl, { method: "PUT", headers: { "Content-Type": "application/pdf" }, body: racingBytes });
  assert(racingPut.status === 200, "The ETag race fixture is uploaded");
  mutateAfterHead.add(racingKey);
  result = await api("/api/storage/complete", { method: "POST", cookie: adminCookie, body: { assetId: racingUpload.data.assetId } });
  assert(result.response.status === 409, "A staging object changed after HEAD is rejected by conditional CopyObject");
  const quarantinedAsset = await pool.query("SELECT status FROM stored_assets WHERE id=$1", [racingUpload.data.assetId]);
  assert(quarantinedAsset.rows[0].status === "quarantined", "An ETag race places the asset in quarantine");

  result = await api("/api/courses");
  assert(result.response.status === 200 && result.data.courses.some((course) => course.slug === "integration-course"), "Published course appears in public catalog");

  result = await api("/api/auth/register", { method: "POST", body: { username: "integration-member", password: "IntegrationMember!Password2026" } });
  assert(result.response.status === 201, "Member can request an account");
  const member = await pool.query("SELECT id FROM users WHERE username_normalized='integration-member'");
  const memberId = Number(member.rows[0].id);

  result = await api("/api/auth/login", { method: "POST", body: { username: "integration-member", password: "IntegrationMember!Password2026" } });
  assert(result.response.status === 403 && !result.cookie, "Pending accounts cannot establish a session before administrator approval");

  result = await api("/api/admin/users", { method: "PATCH", cookie: adminCookie, body: { id: memberId, status: "approved" } });
  assert(result.response.status === 200, "Admin can approve a pending member");
  await pool.query("INSERT INTO user_roles(user_id,role) VALUES($1,'instructor')", [memberId]);

  result = await api("/api/auth/login", { method: "POST", body: { username: "integration-member", password: "IntegrationMember!Password2026" } });
  assert(result.response.status === 200 && result.cookie && result.data.redirectTo === "/instructor", "Approved instructors are sent to their staff workspace after login");
  const memberCookie = result.cookie;

  result = await api("/api/storage/complete", { method: "POST", cookie: memberCookie, body: { assetId: upload.data.assetId } });
  assert(result.response.status === 404, "A different instructor cannot finalize another user's stored asset");
  result = await api(`/api/admin/lessons/${lessonId}/resources`, { method: "POST", cookie: memberCookie, body: { assetId: upload.data.assetId, title: "Unauthorized cross-course resource", isDownloadable: true } });
  assert(result.response.status === 403, "An instructor without course assignment cannot attach an asset to another course");

  result = await api(`/api/courses/integration-course/enroll`, { method: "POST", cookie: memberCookie });
  assert(result.response.status === 201, "Member can enroll in a free published course");

  result = await api(`/api/courses/integration-course`);
  assert(result.response.status === 200 && result.data.sections[0].lessons[0].isPreview, "Public course page exposes preview lesson metadata");

  result = await api(`/api/lessons/${lessonId}/progress`, { method: "POST", cookie: memberCookie, body: { status: "completed", watchedSeconds: 120, lastPositionSeconds: 120 } });
  assert(result.response.status === 409, "A client cannot complete a lesson before a server-recorded start exists");
  result = await api(`/api/lessons/${lessonId}/progress`, { method: "POST", cookie: memberCookie, body: { status: "in_progress", watchedSeconds: 0, lastPositionSeconds: 0 } });
  assert(result.response.status === 200 && result.data.startedAt, "The server records the lesson start timestamp");
  result = await api(`/api/lessons/${lessonId}/progress`, { method: "POST", cookie: memberCookie, body: { status: "completed", watchedSeconds: 120, lastPositionSeconds: 120 } });
  assert(result.response.status === 409, "A client cannot claim the full lesson duration immediately after starting");
  await pool.query("UPDATE lesson_progress SET started_at=NOW()-INTERVAL '120 seconds' WHERE lesson_id=$1 AND user_id=$2", [lessonId,memberId]);
  result = await api(`/api/lessons/${lessonId}/progress`, { method: "POST", cookie: memberCookie, body: { status: "completed", watchedSeconds: 120, lastPositionSeconds: 120 } });
  assert(result.response.status === 200 && !result.data.courseCompleted, `Lesson completion after the server-enforced minimum time does not bypass a required assessment (HTTP ${result.response.status}: ${JSON.stringify(result.data)})`);

  result = await api(`/api/assessments/${assessmentId}`, { cookie: memberCookie });
  assert(result.response.status === 200 && result.data.assessment.title_en === "Updated assessment title English" && result.data.questions.length === 1 && result.data.questions[0].prompt_en === "Updated English question" && result.data.questions[0].options[0].label_en === "Updated English option" && !("answer_key" in result.data.questions[0]) && !("explanation" in result.data.questions[0]), "Enrolled member receives edited English assessment/question text while answer keys and explanations remain secret");
  const persianAssessmentPage = await fetch(`${baseUrl}/courses/integration-course/assessments/${assessmentId}`, { headers: { Cookie: memberCookie } });
  const englishAssessmentPage = await fetch(`${baseUrl}/en/courses/integration-course/assessments/${assessmentId}`, { headers: { Cookie: memberCookie } });
  const [persianAssessmentHtml, englishAssessmentHtml] = await Promise.all([persianAssessmentPage.text(), englishAssessmentPage.text()]);
  assert(persianAssessmentPage.status === 200 && persianAssessmentHtml.includes("assessment-panel"), "Authenticated learner assessment page renders in Persian");
  assert(englishAssessmentPage.status === 200 && englishAssessmentHtml.includes("assessment-panel") && englishAssessmentHtml.includes('dir="ltr"'), "Authenticated learner assessment page renders in English with LTR direction");
  result = await api(`/api/assessments/${assessmentId}/attempts`, { method: "POST", cookie: memberCookie, body: {} });
  assert(result.response.status === 201, `Member can start a timed assessment attempt (HTTP ${result.response.status}: ${JSON.stringify(result.data)})`);
  const attemptId = Number(result.data.attempt.id);
  const questionId = Number(result.data.questions[0].id);
  result = await api(`/api/assessment-attempts/${attemptId}/answers`, { method: "POST", cookie: memberCookie, body: { answers: [{ questionId, answer: "A" }] } });
  assert(result.response.status === 200, "Learner can autosave an answer on their active attempt");
  result = await api(`/api/assessment-attempts/${attemptId}/answers`, { method: "POST", cookie: adminCookie, body: { answers: [{ questionId, answer: "A" }] } });
  assert(result.response.status === 409, "A different account cannot save answers to another learner's attempt");
  result = await api(`/api/assessments/${assessmentId}`, { cookie: memberCookie });
  assert(result.response.status === 200 && Number(result.data.activeAttempt.id) === attemptId && result.data.activeAnswers.some((answer) => Number(answer.question_id) === questionId && answer.answer === "A"), "Assessment GET restores the active attempt and its autosaved answers after refresh");
  result = await api(`/api/assessments/${assessmentId}/attempts`, { method: "POST", cookie: memberCookie, body: {} });
  assert(result.response.status === 201 && Number(result.data.attempt.id) === attemptId && result.data.resumed === true, "Starting again resumes the existing attempt without consuming another attempt");
  result = await api(`/api/assessment-attempts/${attemptId}/submit`, { method: "POST", cookie: adminCookie, body: { answers: [{ questionId, answer: "A" }] } });
  assert(result.response.status === 409, "Assessment attempts cannot be submitted by a different account");
  result = await api(`/api/assessment-attempts/${attemptId}/submit`, { method: "POST", cookie: memberCookie, body: { answers: [{ questionId, answer: "A" }] } });
  assert(result.response.status === 200 && result.data.passed && result.data.courseCompleted, `Passing the required assessment completes the course (HTTP ${result.response.status}: ${JSON.stringify(result.data)})`);

  result = await api(`/api/admin/courses/${courseId}/assessments`, { method: "POST", cookie: adminCookie, body: { title: "Revoked enrollment autosave guard", maxAttempts: 2 } });
  const revokedGuardAssessmentId = Number(result.data.assessment.id);
  result = await api(`/api/admin/assessments/${revokedGuardAssessmentId}/questions`, { method: "POST", cookie: adminCookie, body: { questionType: "true_false", prompt: "Enrollment still valid?", answerKey: true } });
  assert(result.response.status === 201, "Revocation guard assessment question is created");
  result = await api(`/api/admin/assessments/${revokedGuardAssessmentId}`, { method: "PATCH", cookie: adminCookie, body: { status: "published" } });
  assert(result.response.status === 200, "Revocation guard assessment is published");
  result = await api(`/api/assessments/${revokedGuardAssessmentId}/attempts`, { method: "POST", cookie: memberCookie, body: {} });
  assert(result.response.status === 201, "Learner can start before enrollment revocation");
  const revokedGuardAttemptId = Number(result.data.attempt.id);
  const revokedGuardQuestionId = Number(result.data.questions[0].id);
  await pool.query("UPDATE course_enrollments SET status='revoked' WHERE course_id=$1 AND user_id=$2", [courseId,memberId]);
  result = await api(`/api/assessment-attempts/${revokedGuardAttemptId}/answers`, { method: "POST", cookie: memberCookie, body: { answers: [{ questionId: revokedGuardQuestionId, answer: true }] } });
  assert(result.response.status === 403, "Revoked enrollment blocks autosave on an existing attempt");
  result = await api(`/api/assessment-attempts/${revokedGuardAttemptId}/submit`, { method: "POST", cookie: memberCookie, body: { answers: [{ questionId: revokedGuardQuestionId, answer: true }] } });
  const revokedAnswerCount = await pool.query("SELECT COUNT(*)::int AS count FROM assessment_answers WHERE attempt_id=$1", [revokedGuardAttemptId]);
  const revokedAttemptState = await pool.query("SELECT status FROM assessment_attempts WHERE id=$1", [revokedGuardAttemptId]);
  assert(result.response.status === 403 && revokedAnswerCount.rows[0].count === 0 && revokedAttemptState.rows[0].status === "in_progress", "Revoked enrollment also blocks final submission without persisting answers or grading the attempt");
  await pool.query("UPDATE course_enrollments SET status='completed',expires_at=NULL WHERE course_id=$1 AND user_id=$2", [courseId,memberId]);

  result = await api(`/api/admin/courses/${courseId}/assessments`, { method: "POST", cookie: adminCookie, body: { title: "Expired enrollment submit guard", maxAttempts: 2 } });
  const expiredGuardAssessmentId = Number(result.data.assessment.id);
  result = await api(`/api/admin/assessments/${expiredGuardAssessmentId}/questions`, { method: "POST", cookie: adminCookie, body: { questionType: "true_false", prompt: "Enrollment still current?", answerKey: true } });
  assert(result.response.status === 201, "Expiry guard assessment question is created");
  result = await api(`/api/admin/assessments/${expiredGuardAssessmentId}`, { method: "PATCH", cookie: adminCookie, body: { status: "published" } });
  assert(result.response.status === 200, "Expiry guard assessment is published");
  result = await api(`/api/assessments/${expiredGuardAssessmentId}/attempts`, { method: "POST", cookie: memberCookie, body: {} });
  assert(result.response.status === 201, "Learner can start before enrollment expiry");
  const expiredGuardAttemptId = Number(result.data.attempt.id);
  const expiredGuardQuestionId = Number(result.data.questions[0].id);
  await pool.query("UPDATE course_enrollments SET expires_at=NOW()-INTERVAL '1 second' WHERE course_id=$1 AND user_id=$2", [courseId,memberId]);
  result = await api(`/api/assessment-attempts/${expiredGuardAttemptId}/answers`, { method: "POST", cookie: memberCookie, body: { answers: [{ questionId: expiredGuardQuestionId, answer: true }] } });
  assert(result.response.status === 403, "Expired enrollment blocks autosave on an existing attempt");
  result = await api(`/api/assessment-attempts/${expiredGuardAttemptId}/submit`, { method: "POST", cookie: memberCookie, body: { answers: [{ questionId: expiredGuardQuestionId, answer: true }] } });
  const expiredSubmitCount = await pool.query("SELECT COUNT(*)::int AS count FROM assessment_answers WHERE attempt_id=$1", [expiredGuardAttemptId]);
  const expiredAttemptState = await pool.query("SELECT status FROM assessment_attempts WHERE id=$1", [expiredGuardAttemptId]);
  assert(result.response.status === 403 && expiredSubmitCount.rows[0].count === 0 && expiredAttemptState.rows[0].status === "in_progress", "Expired enrollment blocks final submission without persisting answers or grading the attempt");
  await pool.query("UPDATE course_enrollments SET expires_at=NULL WHERE course_id=$1 AND user_id=$2", [courseId,memberId]);
  for (const guardedAssessmentId of [revokedGuardAssessmentId,expiredGuardAssessmentId]) {
    result = await api(`/api/admin/assessments/${guardedAssessmentId}`, { method: "PATCH", cookie: adminCookie, body: { status: "archived" } });
    assert(result.response.status === 200, "Enrollment guard regression fixtures are archived before certificate eligibility is checked");
  }

  result = await api(`/api/admin/courses/${courseId}/assessments`, { method: "POST", cookie: adminCookie, body: { title: "Enrollment expiry lock-wait guard" } });
  const lockWaitExpiryAssessmentId = Number(result.data.assessment.id);
  result = await api(`/api/admin/assessments/${lockWaitExpiryAssessmentId}/questions`, { method: "POST", cookie: adminCookie, body: { questionType: "true_false", prompt: "Still enrolled after lock wait?", answerKey: true } });
  assert(result.response.status === 201, "Lock-wait expiry assessment question is created");
  result = await api(`/api/admin/assessments/${lockWaitExpiryAssessmentId}`, { method: "PATCH", cookie: adminCookie, body: { status: "published" } });
  assert(result.response.status === 200, "Lock-wait expiry assessment is published");
  await pool.query("UPDATE course_enrollments SET expires_at=clock_timestamp()+INTERVAL '2 seconds' WHERE course_id=$1 AND user_id=$2", [courseId,memberId]);
  const expiryLock = await pool.connect();
  await expiryLock.query("BEGIN");
  await expiryLock.query("SELECT id FROM assessments WHERE id=$1 FOR UPDATE", [lockWaitExpiryAssessmentId]);
  await expiryLock.query("SELECT id FROM course_enrollments WHERE course_id=$1 AND user_id=$2 FOR UPDATE", [courseId,memberId]);
  const delayedExpiredStart = api(`/api/assessments/${lockWaitExpiryAssessmentId}/attempts`, { method: "POST", cookie: memberCookie, body: {} });
  const expiryStartWaited = await Promise.race([delayedExpiredStart.then(() => false), new Promise((resolve) => setTimeout(() => resolve(true), 250))]);
  await new Promise((resolve) => setTimeout(resolve, 2100));
  await expiryLock.query("COMMIT");
  expiryLock.release();
  result = await delayedExpiredStart;
  const lockWaitExpiredAttemptCount = await pool.query("SELECT COUNT(*)::int AS count FROM assessment_attempts WHERE assessment_id=$1 AND user_id=$2", [lockWaitExpiryAssessmentId,memberId]);
  assert(expiryStartWaited === true && result.response.status === 403 && lockWaitExpiredAttemptCount.rows[0].count === 0, "Start rechecks enrollment expiry after waiting on row locks and does not create an attempt");
  await pool.query("UPDATE course_enrollments SET expires_at=NULL WHERE course_id=$1 AND user_id=$2", [courseId,memberId]);
  result = await api(`/api/admin/assessments/${lockWaitExpiryAssessmentId}`, { method: "PATCH", cookie: adminCookie, body: { status: "archived" } });
  assert(result.response.status === 200, "Lock-wait expiry fixture is archived before certificate eligibility is checked");

  result = await api(`/api/admin/courses/${courseId}/assessments`, { method: "POST", cookie: adminCookie, body: { title: "Time limit lock-wait guard", timeLimitSeconds: 4 } });
  const lockWaitTimerAssessmentId = Number(result.data.assessment.id);
  result = await api(`/api/admin/assessments/${lockWaitTimerAssessmentId}/questions`, { method: "POST", cookie: adminCookie, body: { questionType: "true_false", prompt: "Timer starts after lock acquisition?", answerKey: true } });
  assert(result.response.status === 201, "Lock-wait timer assessment question is created");
  result = await api(`/api/admin/assessments/${lockWaitTimerAssessmentId}`, { method: "PATCH", cookie: adminCookie, body: { status: "published" } });
  assert(result.response.status === 200, "Lock-wait timer assessment is published");
  const timerLock = await pool.connect();
  await timerLock.query("BEGIN");
  await timerLock.query("SELECT id FROM assessments WHERE id=$1 FOR UPDATE", [lockWaitTimerAssessmentId]);
  const delayedTimedStart = api(`/api/assessments/${lockWaitTimerAssessmentId}/attempts`, { method: "POST", cookie: memberCookie, body: {} });
  const timerStartWaited = await Promise.race([delayedTimedStart.then(() => false), new Promise((resolve) => setTimeout(() => resolve(true), 250))]);
  await new Promise((resolve) => setTimeout(resolve, 1500));
  await timerLock.query("COMMIT");
  timerLock.release();
  result = await delayedTimedStart;
  const remainingTimeMs = result.data.attempt?.due_at ? new Date(result.data.attempt.due_at).getTime() - Date.now() : -1;
  assert(timerStartWaited === true && result.response.status === 201 && remainingTimeMs >= 3500, "A timed attempt receives its full configured duration after row-lock wait");
  result = await api(`/api/admin/assessments/${lockWaitTimerAssessmentId}`, { method: "PATCH", cookie: adminCookie, body: { status: "archived" } });
  assert(result.response.status === 200, "Lock-wait timer fixture is archived before certificate eligibility is checked");

  result = await api(`/api/admin/courses/${courseId}/assessments`, { method: "POST", cookie: adminCookie, body: { title: "Concurrent attempt guard", maxAttempts: 1 } });
  const concurrentAssessmentId = Number(result.data.assessment.id);
  result = await api(`/api/admin/assessments/${concurrentAssessmentId}/questions`, { method: "POST", cookie: adminCookie, body: { questionType: "true_false", prompt: "Concurrent request guard?", answerKey: true } });
  assert(result.response.status === 201, "Concurrent attempt assessment question is created");
  result = await api(`/api/admin/assessments/${concurrentAssessmentId}`, { method: "PATCH", cookie: adminCookie, body: { status: "published" } });
  assert(result.response.status === 200, "Concurrent attempt assessment is published");
  const concurrentStarts = await Promise.all([
    api(`/api/assessments/${concurrentAssessmentId}/attempts`, { method: "POST", cookie: memberCookie, body: {} }),
    api(`/api/assessments/${concurrentAssessmentId}/attempts`, { method: "POST", cookie: memberCookie, body: {} }),
  ]);
  const concurrentAttemptIds = concurrentStarts.map((item) => Number(item.data.attempt?.id));
  const concurrentQuestionId = Number(concurrentStarts[0].data.questions[0].id);
  const concurrentAttemptCount = await pool.query("SELECT COUNT(*)::int AS count FROM assessment_attempts WHERE assessment_id=$1 AND user_id=$2", [concurrentAssessmentId,memberId]);
  assert(concurrentStarts.every((item) => item.response.status === 201) && concurrentAttemptIds[0] === concurrentAttemptIds[1] && concurrentAttemptCount.rows[0].count === 1, "Concurrent starts resume one shared attempt instead of creating duplicate attempts");
  const concurrentAttemptId = concurrentAttemptIds[0];
  const concurrentSaves = await Promise.all([
    api(`/api/assessment-attempts/${concurrentAttemptId}/answers`, { method: "POST", cookie: memberCookie, body: { answers: [{ questionId: concurrentQuestionId, answer: true }] } }),
    api(`/api/assessment-attempts/${concurrentAttemptId}/answers`, { method: "POST", cookie: memberCookie, body: { answers: [{ questionId: concurrentQuestionId, answer: true }] } }),
  ]);
  const concurrentAnswerCount = await pool.query("SELECT COUNT(*)::int AS count FROM assessment_answers WHERE attempt_id=$1", [concurrentAttemptId]);
  assert(concurrentSaves.every((item) => item.response.status === 200) && concurrentAnswerCount.rows[0].count === 1, "Concurrent autosaves serialize and retain one answer row per question");
  const concurrentSubmissions = await Promise.all([
    api(`/api/assessment-attempts/${concurrentAttemptId}/submit`, { method: "POST", cookie: memberCookie, body: { answers: [{ questionId: concurrentQuestionId, answer: true }] } }),
    api(`/api/assessment-attempts/${concurrentAttemptId}/submit`, { method: "POST", cookie: memberCookie, body: { answers: [{ questionId: concurrentQuestionId, answer: true }] } }),
  ]);
  const concurrentFinalState = await pool.query("SELECT status,COUNT(*) OVER()::int AS row_count FROM assessment_attempts WHERE id=$1", [concurrentAttemptId]);
  assert(concurrentSubmissions.filter((item) => item.response.status === 200).length === 1 && concurrentSubmissions.filter((item) => item.response.status === 409).length === 1 && concurrentFinalState.rows[0]?.status === "graded" && concurrentFinalState.rows[0]?.row_count === 1, "Concurrent final submissions grade an attempt exactly once and reject the duplicate");
  result = await api(`/api/admin/assessments/${concurrentAssessmentId}`, { method: "PATCH", cookie: adminCookie, body: { status: "archived" } });
  assert(result.response.status === 200, "Concurrent assessment fixture is archived before certificate eligibility is checked");

  result = await api(`/api/courses/integration-course/certificate`, { method: "POST", cookie: memberCookie, body: {} });
  assert(result.response.status === 201 && result.data.certificate.serial_number, `Member can issue a certificate after completing lessons and assessments (HTTP ${result.response.status}: ${JSON.stringify(result.data)})`);
  const certificateId = result.data.certificate.public_id;
  result = await api(`/api/certificates/${certificateId}`);
  assert(result.response.status === 200 && result.data.certificate.valid, "Certificate has a public verification endpoint");

  result = await api(`/api/admin/courses/${courseId}/assessments`, { method: "POST", cookie: adminCookie, body: { title: "Manual review", titleEn: "Manual review English", descriptionEn: "Manual review description" } });
  assert(result.response.status === 201, "Admin can create an additional assessment for manual grading");
  const manualAssessmentId = Number(result.data.assessment.id);
  result = await api(`/api/admin/assessments/${manualAssessmentId}/questions`, { method: "POST", cookie: adminCookie, body: { questionType: "short_text", prompt: "پاسخ تشریحی", promptEn: "Explain your answer", explanationEn: "Instructor feedback guide", points: 2 } });
  assert(result.response.status === 201, "Admin can create an English short-text question");
  result = await api(`/api/admin/assessments/${manualAssessmentId}/questions`, { method: "POST", cookie: adminCookie, body: { questionType: "multiple_choice", prompt: "انتخاب درست", promptEn: "Choose the correct option", options: [{ id: "A", label: "درست", label_en: "Correct" }, { id: "B", label: "نادرست", label_en: "Incorrect" }], answerKey: ["A"], points: 1 } });
  assert(result.response.status === 201, "Admin can create a bilingual multiple-choice question");
  result = await api(`/api/admin/assessments/${manualAssessmentId}`, { method: "PATCH", cookie: adminCookie, body: { status: "published" } });
  assert(result.response.status === 200, "Manual grading assessment can be published");
  result = await api(`/api/assessments/${manualAssessmentId}/attempts`, { method: "POST", cookie: memberCookie, body: {} });
  assert(result.response.status === 201, "Enrolled learner can start the manual grading assessment");
  const manualAttemptId = Number(result.data.attempt.id);
  const manualQuestionId = Number(result.data.questions.find((question) => question.question_type === "short_text").id);
  const multipleChoiceQuestionId = Number(result.data.questions.find((question) => question.question_type === "multiple_choice").id);
  result = await api(`/api/assessment-attempts/${manualAttemptId}/submit`, { method: "POST", cookie: memberCookie, body: { answers: [{ questionId: manualQuestionId, answer: "" }, { questionId: multipleChoiceQuestionId, answer: [] }] } });
  assert(result.response.status === 400, "Final submission rejects empty written answers and empty multiple-choice selections");
  result = await api(`/api/assessment-attempts/${manualAttemptId}/submit`, { method: "POST", cookie: memberCookie, body: { answers: [{ questionId: manualQuestionId, answer: "My considered response" }, { questionId: multipleChoiceQuestionId, answer: ["A"] }] } });
  assert(result.response.status === 200 && result.data.requiresManualGrade && result.data.status === "submitted", "Short-text answers are submitted for manual grading without being auto-passed");
  result = await api(`/api/assessments/${manualAssessmentId}`, { cookie: memberCookie });
  assert(result.response.status === 200 && result.data.attemptHistory.some((attempt) => attempt.status === "submitted"), "Learner assessment history shows a submitted attempt awaiting manual grading");
  const manualAnswer = await pool.query("SELECT id FROM assessment_answers WHERE attempt_id=$1", [manualAttemptId]);
  result = await api(`/api/admin/assessment-attempts/${manualAttemptId}`, { method: "PATCH", cookie: adminCookie, body: { answers: [{ answerId: Number(manualAnswer.rows[0].id), pointsAwarded: 2, feedback: "Well explained" }] } });
  assert(result.response.status === 200 && result.data.result.passed, "Instructor can manually grade a submitted short-text response");
  result = await api(`/api/assessments/${manualAssessmentId}`, { cookie: memberCookie });
  assert(result.response.status === 200 && result.data.attemptHistory.some((attempt) => attempt.status === "graded" && attempt.passed === true && Number(attempt.score_percent) === 100), "Learner history exposes their own final score and manual grading outcome");

  result = await api(`/api/admin/courses/${courseId}/assessments`, { method: "POST", cookie: adminCookie, body: { title: "Shuffled questions", shuffleQuestions: true } });
  const shuffledAssessmentId = Number(result.data.assessment.id);
  for (let index = 0; index < 5; index += 1) {
    result = await api(`/api/admin/assessments/${shuffledAssessmentId}/questions`, { method: "POST", cookie: adminCookie, body: { questionType: "true_false", prompt: `Shuffle question ${index + 1}`, answerKey: true } });
    assert(result.response.status === 201, "Shuffled assessment question is created");
  }
  result = await api(`/api/admin/assessments/${shuffledAssessmentId}`, { method: "PATCH", cookie: adminCookie, body: { status: "published" } });
  assert(result.response.status === 200, "Shuffled assessment is published");
  result = await api(`/api/assessments/${shuffledAssessmentId}/attempts`, { method: "POST", cookie: memberCookie, body: {} });
  const shuffledAttemptId = Number(result.data.attempt.id);
  const shuffledOrder = result.data.questions.map((question) => Number(question.id));
  result = await api(`/api/assessments/${shuffledAssessmentId}`, { cookie: memberCookie });
  assert(result.response.status === 200 && result.data.questions.map((question) => Number(question.id)).join(",") === shuffledOrder.join(","), "Shuffled question order is deterministic for GET refresh recovery");
  result = await api(`/api/assessments/${shuffledAssessmentId}/attempts`, { method: "POST", cookie: memberCookie, body: {} });
  assert(result.response.status === 201 && Number(result.data.attempt.id) === shuffledAttemptId && result.data.questions.map((question) => Number(question.id)).join(",") === shuffledOrder.join(","), "Repeated start resumes the same shuffled question order");

  result = await api(`/api/admin/courses/${courseId}/assessments`, { method: "POST", cookie: adminCookie, body: { title: "Ordered questions", shuffleQuestions: false, timeLimitSeconds: 300 } });
  const orderedAssessmentId = Number(result.data.assessment.id);
  for (let index = 0; index < 3; index += 1) {
    result = await api(`/api/admin/assessments/${orderedAssessmentId}/questions`, { method: "POST", cookie: adminCookie, body: { questionType: "true_false", prompt: `Ordered question ${index + 1}`, answerKey: true } });
    assert(result.response.status === 201, "Ordered assessment question is created");
  }
  result = await api(`/api/admin/assessments/${orderedAssessmentId}`, { method: "PATCH", cookie: adminCookie, body: { status: "published" } });
  assert(result.response.status === 200, "Non-shuffled assessment is published");
  const expectedPositionOrder = (await pool.query("SELECT id FROM assessment_questions WHERE assessment_id=$1 ORDER BY position", [orderedAssessmentId])).rows.map((question) => Number(question.id));
  result = await api(`/api/assessments/${orderedAssessmentId}/attempts`, { method: "POST", cookie: memberCookie, body: {} });
  assert(result.response.status === 201 && result.data.questions.map((question) => Number(question.id)).join(",") === expectedPositionOrder.join(","), "Non-shuffled assessment preserves author-defined question position");
  const orderedAttemptId = Number(result.data.attempt.id);
  const orderedQuestionId = Number(result.data.questions[0].id);
  await pool.query("UPDATE assessment_attempts SET due_at=NOW()-INTERVAL '1 second' WHERE id=$1", [orderedAttemptId]);
  result = await api(`/api/assessment-attempts/${orderedAttemptId}/answers`, { method: "POST", cookie: memberCookie, body: { answers: [{ questionId: orderedQuestionId, answer: "A" }] } });
  assert(result.response.status === 409, "Autosave is rejected after the server-enforced assessment deadline");
  result = await api(`/api/assessment-attempts/${orderedAttemptId}/submit`, { method: "POST", cookie: memberCookie, body: { answers: [{ questionId: orderedQuestionId, answer: "A" }] } });
  const timedOutAnswerCount = await pool.query("SELECT COUNT(*)::int AS count FROM assessment_answers WHERE attempt_id=$1", [orderedAttemptId]);
  assert(result.response.status === 409 && timedOutAnswerCount.rows[0].count === 0, "Final submission after the deadline is rejected without persisting answers");
  result = await api(`/api/assessments/${orderedAssessmentId}`, { cookie: memberCookie });
  assert(result.response.status === 200 && result.data.activeAttempt === null && result.data.attemptHistory.some((attempt) => attempt.status === "expired"), "Expired in-progress attempts are closed and remain visible in learner history");
  result = await api(`/api/assessments/${orderedAssessmentId}/attempts`, { method: "POST", cookie: memberCookie, body: {} });
  assert(result.response.status === 409, "Expired attempts remain counted against the configured attempt limit");

  result = await api("/api/admin/courses", { method: "POST", cookie: adminCookie, body: { title: "Members Course", slug: "members-course", accessType: "members", priceMinor: 0 } });
  assert(result.response.status === 201, "Admin can create a members-only course");
  const membersCourseId = Number(result.data.course.id);
  result = await api(`/api/admin/courses/${membersCourseId}/sections`, { method: "POST", cookie: adminCookie, body: { title: "Member section" } });
  assert(result.response.status === 201, "Admin can create a section for members-only course");
  const membersSectionId = Number(result.data.section.id);
  result = await api(`/api/admin/sections/${membersSectionId}/lessons`, { method: "POST", cookie: adminCookie, body: { title: "Members lesson", content: "Members only", status: "published" } });
  assert(result.response.status === 201, "Admin can add a lesson to members-only course");
  result = await api(`/api/admin/courses/${membersCourseId}`, { method: "PATCH", cookie: adminCookie, body: { status: "published" } });
  assert(result.response.status === 200, "Members-only course can be published");
  const untranslatedEnglishCoursePage = await fetch(`${baseUrl}/en/courses/members-course`);
  const untranslatedEnglishCourseHtml = await untranslatedEnglishCoursePage.text();
  assert(untranslatedEnglishCoursePage.status === 200 && untranslatedEnglishCourseHtml.includes("Translation pending"), "Missing course, section and lesson translations are explicitly marked pending");
  assert(!untranslatedEnglishCourseHtml.includes("Members Course") && !untranslatedEnglishCourseHtml.includes("Member section") && !untranslatedEnglishCourseHtml.includes("Members lesson") && !untranslatedEnglishCourseHtml.includes("Members only"), "English course detail never falls back to untranslated source content");

  result = await api("/api/admin/membership-plans", { method: "POST", cookie: adminCookie, body: { code: "integration-member", name: "Integration Member", level: 1, priceMinor: 0, billingInterval: "none", benefits: ["Members-only course access"] } });
  assert(result.response.status === 201, `Admin can create a free membership plan (HTTP ${result.response.status}: ${JSON.stringify(result.data)})`);
  const planId = Number(result.data.plan.id);
  result = await api(`/api/admin/membership-plans/${planId}/courses`, { method: "PUT", cookie: adminCookie, body: { courseIds: [membersCourseId] } });
  assert(result.response.status === 200, "Admin can map a course to a membership plan");
  result = await api("/api/membership/requests", { method: "POST", cookie: memberCookie, body: { planId, message: "Integration membership request" } });
  assert(result.response.status === 201, "Member can request a free membership plan");
  const membershipRequest = await pool.query("SELECT id FROM membership_requests WHERE user_id=$1 AND plan_id=$2", [memberId,planId]);
  result = await api(`/api/admin/membership-requests/${Number(membershipRequest.rows[0].id)}`, { method: "PATCH", cookie: adminCookie, body: { status: "approved", reason: "Integration approval" } });
  assert(result.response.status === 200, "Admin can approve a membership request and grant mapped course access");
  result = await api("/api/membership/me", { cookie: memberCookie });
  assert(result.response.status === 200 && result.data.memberships.some((item) => Number(item.plan_id) === planId && item.status === "active"), "Member can view active membership history");
  result = await api("/api/courses/members-course/enroll", { method: "POST", cookie: memberCookie });
  assert((result.response.status === 200 || result.response.status === 201) && result.data.enrolled, `Active membership unlocks mapped course enrollment (HTTP ${result.response.status}: ${JSON.stringify(result.data)})`);

  result = await api("/api/admin/courses", { method: "POST", cookie: adminCookie, body: { title: "Scheduled Membership Course", slug: "scheduled-membership-course", accessType: "members", priceMinor: 0 } });
  assert(result.response.status === 201, "Admin can create a course for a scheduled membership test");
  const scheduledCourseId = Number(result.data.course.id);
  result = await api("/api/admin/membership-plans", { method: "POST", cookie: adminCookie, body: { code: "integration-scheduled", name: "Integration Scheduled", level: 3, priceMinor: 0, billingInterval: "none", benefits: ["Scheduled entitlement"] } });
  assert(result.response.status === 201, "Admin can create a scheduled membership test plan");
  const scheduledPlanId = Number(result.data.plan.id);
  result = await api(`/api/admin/membership-plans/${scheduledPlanId}/courses`, { method: "PUT", cookie: adminCookie, body: { courseIds: [scheduledCourseId] } });
  assert(result.response.status === 200, "Scheduled membership plan receives a course entitlement");
  const scheduledMembership = await pool.query(`INSERT INTO memberships(user_id,plan_id,status,starts_at,ends_at,source)
    VALUES($1,$2,'pending',NOW()-INTERVAL '1 minute',NOW()+INTERVAL '1 day','member_change') RETURNING id`, [memberId,scheduledPlanId]);
  result = await api("/api/membership/me", { cookie: memberCookie });
  assert(result.response.status === 200 && result.data.memberships.some((item) => Number(item.id) === Number(scheduledMembership.rows[0].id) && item.status === "active"), "Scheduled membership activates when its start time arrives");
  let scheduledEnrollment = await pool.query("SELECT status FROM course_enrollments WHERE course_id=$1 AND user_id=$2", [scheduledCourseId,memberId]);
  assert(scheduledEnrollment.rows[0]?.status === "active", "Scheduled membership activation creates its mapped course entitlement");
  await pool.query("UPDATE memberships SET ends_at=NOW()-INTERVAL '1 minute' WHERE id=$1", [scheduledMembership.rows[0].id]);
  result = await api("/api/membership/me", { cookie: memberCookie });
  assert(result.response.status === 200 && result.data.memberships.some((item) => Number(item.id) === Number(scheduledMembership.rows[0].id) && item.status === "expired"), "Expired membership is transitioned during member sync");
  scheduledEnrollment = await pool.query("SELECT status FROM course_enrollments WHERE course_id=$1 AND user_id=$2", [scheduledCourseId,memberId]);
  const scheduledEvents = await pool.query("SELECT id FROM course_enrollment_events WHERE enrollment_id=(SELECT id FROM course_enrollments WHERE course_id=$1 AND user_id=$2) AND event_type='revoked'", [scheduledCourseId,memberId]);
  assert(scheduledEnrollment.rows[0]?.status === "revoked" && scheduledEvents.rowCount === 1, "Membership expiry revokes its entitlement and records one enrollment event");

  result = await api("/api/admin/events", { method: "POST", cookie: adminCookie, body: { slug: "integration-event", title: "Integration Community Event فارسی", titleEn: "Integration Community Event English", summary: "Capacity and waitlist test فارسی", summaryEn: "Capacity and waitlist test English", description: "Integration event فارسی", descriptionEn: "Integration event English", location: "تهران", locationEn: "Online English", startsAt: new Date(Date.now()+86400000).toISOString(), endsAt: new Date(Date.now()+90000000).toISOString(), capacity: 1, accessType: "public", priceMinor: 0 } });
  assert(result.response.status === 201, `Admin can create an event (HTTP ${result.response.status}: ${JSON.stringify(result.data)})`);
  const eventId = Number(result.data.event.id);
  result = await api(`/api/admin/events/${eventId}`, { method: "PATCH", cookie: adminCookie, body: { titleEn: "Updated community event English", summaryEn: "Updated event summary English", descriptionEn: "Updated event description English", locationEn: "Virtual venue English" } });
  assert(result.response.status === 200 && result.data.event.title_en === "Updated community event English", "Admin can edit English event fields");
  result = await api(`/api/admin/events/${eventId}`, { method: "PATCH", cookie: adminCookie, body: { status: "published" } });
  assert(result.response.status === 200, "Admin can publish an event");
  const englishEventsPage = await fetch(`${baseUrl}/en/events`);
  const englishEventsHtml = await englishEventsPage.text();
  assert(englishEventsPage.status === 200 && englishEventsHtml.includes("Updated community event English") && englishEventsHtml.includes("Updated event summary English"), "English events catalog uses translated event fields");
  const englishEventPage = await fetch(`${baseUrl}/en/events/integration-event`);
  const englishEventHtml = await englishEventPage.text();
  assert(englishEventPage.status === 200 && englishEventHtml.includes("Updated event description English") && englishEventHtml.includes("Virtual venue English"), "English event detail uses translated description and location");
  assert(!englishEventHtml.includes("Integration Community Event فارسی") && !englishEventHtml.includes("تهران"), "English event detail never falls back to Persian content");
  result = await api("/api/admin/events", { method: "POST", cookie: adminCookie, body: { slug: "integration-event-untranslated", title: "رویداد بدون ترجمه", summary: "خلاصه فارسی", description: "توضیح فارسی", location: "تهران", startsAt: new Date(Date.now()+172800000).toISOString(), endsAt: new Date(Date.now()+176400000).toISOString(), capacity: null, accessType: "public", priceMinor: 0 } });
  assert(result.response.status === 201, "Admin can create an event before its English translation is ready");
  const untranslatedEventId = Number(result.data.event.id);
  result = await api(`/api/admin/events/${untranslatedEventId}`, { method: "PATCH", cookie: adminCookie, body: { status: "published" } });
  assert(result.response.status === 200, "Untranslated event can still be published in the source locale");
  const untranslatedEnglishEventPage = await fetch(`${baseUrl}/en/events/integration-event-untranslated`);
  const untranslatedEnglishEventHtml = await untranslatedEnglishEventPage.text();
  assert(untranslatedEnglishEventPage.status === 200 && untranslatedEnglishEventHtml.includes("Translation pending"), "Missing English event translations are explicitly marked pending");
  assert(!untranslatedEnglishEventHtml.includes("رویداد بدون ترجمه") && !untranslatedEnglishEventHtml.includes("خلاصه فارسی") && !untranslatedEnglishEventHtml.includes("تهران"), "English event detail never falls back to Persian source content");
  result = await api("/api/events/integration-event/register", { method: "POST", cookie: memberCookie });
  assert(result.response.status === 201 && result.data.registration.status === "registered", "First member receives the final event seat");
  result = await api("/api/auth/register", { method: "POST", body: { username: "integration-member-two", password: "IntegrationMemberTwo!Password2026" } });
  assert(result.response.status === 201, "Second member can request an account");
  const memberTwo = await pool.query("SELECT id FROM users WHERE username_normalized='integration-member-two'");
  const memberTwoId = Number(memberTwo.rows[0].id);
  result = await api("/api/admin/users", { method: "PATCH", cookie: adminCookie, body: { id: memberTwoId, status: "approved" } });
  assert(result.response.status === 200, "Admin can approve the second member");
  result = await api("/api/auth/login", { method: "POST", body: { username: "integration-member-two", password: "IntegrationMemberTwo!Password2026" } });
  assert(result.response.status === 200 && result.cookie, "Second approved member can log in");
  const memberTwoCookie = result.cookie;
  result = await api("/api/events/integration-event/register", { method: "POST", cookie: memberTwoCookie });
  assert(result.response.status === 201 && result.data.registration.status === "waitlisted", "Event capacity places the second member on the waitlist");
  result = await api("/api/events/integration-event/cancel", { method: "POST", cookie: memberCookie });
  assert(result.response.status === 200 && result.data.promoted, "Canceling a seat promotes the next waitlisted member");
  const promoted = await pool.query("SELECT status FROM event_registrations WHERE event_id=$1 AND user_id=$2", [eventId,memberTwoId]);
  assert(promoted.rows[0].status === "registered", "Waitlisted member promotion is persisted");

  result = await api("/api/admin/membership-plans", { method: "POST", cookie: adminCookie, body: { code: "integration-member-plus", name: "Integration Member Plus فارسی", nameEn: "Integration Member Plus English", description: "Plan description فارسی", descriptionEn: "Plan description English", level: 2, priceMinor: 0, billingInterval: "none", benefits: ["Expanded member access فارسی"], benefitsEn: ["Expanded member access English"] } });
  assert(result.response.status === 201, "Admin can create a second membership tier");
  const higherPlanId = Number(result.data.plan.id);
  result = await api(`/api/admin/membership-plans/${higherPlanId}`, { method: "PATCH", cookie: adminCookie, body: { nameEn: "Updated membership plan English", descriptionEn: "Updated membership description English", benefitsEn: ["Updated English benefit"] } });
  assert(result.response.status === 200 && result.data.plan.name_en === "Updated membership plan English", "Admin can edit membership plan English fields");
  const englishPortalMembershipPage = await fetch(`${baseUrl}/en/portal-membership`);
  const englishPortalMembershipHtml = await englishPortalMembershipPage.text();
  assert(englishPortalMembershipPage.status === 200 && englishPortalMembershipHtml.includes("Updated membership plan English") && englishPortalMembershipHtml.includes("Updated membership description English") && englishPortalMembershipHtml.includes("Updated English benefit"), "English portal membership page uses translated plan fields");
  assert(englishPortalMembershipHtml.includes("Translation pending"), "Portal membership plans without English fields are marked pending");
  assert(!englishPortalMembershipHtml.includes("Integration Member Plus فارسی") && !englishPortalMembershipHtml.includes("Plan description فارسی") && !englishPortalMembershipHtml.includes("Expanded member access فارسی"), "English portal membership never falls back to Persian plan content");
  result = await api(`/api/admin/membership-plans/${higherPlanId}/courses`, { method: "PUT", cookie: adminCookie, body: { courseIds: [membersCourseId] } });
  assert(result.response.status === 200, "Second membership tier can receive course entitlements");
  result = await api("/api/membership/change", { method: "POST", cookie: memberCookie, body: { planId: higherPlanId } });
  assert(result.response.status === 200 && result.data.result.changeType === "upgrade", `Member can upgrade between active free tiers (HTTP ${result.response.status}: ${JSON.stringify(result.data)})`);
  const changedMembershipId = Number(result.data.result.membership.id);
  result = await api("/api/membership/cancel", { method: "POST", cookie: memberCookie, body: { membershipId: changedMembershipId } });
  assert(result.response.status === 200 && result.data.result.status === "canceled", "Member can cancel a free membership and revoke its entitlements");
  const revokedEnrollment = await pool.query("SELECT status FROM course_enrollments WHERE course_id=$1 AND user_id=$2", [membersCourseId,memberId]);
  assert(revokedEnrollment.rows[0].status === "revoked", "Canceling membership revokes its mapped course enrollment");
  const cancellationEvents = await pool.query("SELECT COUNT(*)::int AS count FROM course_enrollment_events WHERE enrollment_id=(SELECT id FROM course_enrollments WHERE course_id=$1 AND user_id=$2) AND event_type='revoked'", [membersCourseId,memberId]);
  assert(cancellationEvents.rows[0].count === 1, "Membership cancellation records an enrollment revocation event");

  result = await api("/api/profile", { method: "PUT", cookie: memberCookie, body: { displayName: "Integration Member", email: "integration-member@example.test", phone: "+49123456789", locale: "fa", timezone: "Europe/Berlin" } });
  assert(result.response.status === 200, "Member can update profile and locale preferences");
  result = await api("/api/profile", { cookie: memberCookie });
  assert(result.response.status === 200 && result.data.profile.email === "integration-member@example.test", "Member profile changes persist");

  result = await api("/api/support/messages", { method: "POST", cookie: memberCookie, body: { subject: "Integration support", message: "Please help with an integration test support request." } });
  assert(result.response.status === 201, "Member can open a support request");
  const supportMessage = await pool.query("SELECT id FROM support_messages WHERE user_id=$1 ORDER BY id DESC LIMIT 1", [memberId]);
  result = await api(`/api/admin/users/${memberTwoId}/roles`, { method: "POST", cookie: adminCookie, body: { role: "support" } });
  assert(result.response.status === 201, "Admin can grant the support role");
  result = await api("/api/admin/support/messages", { cookie: memberTwoCookie });
  assert(result.response.status === 200 && result.data.messages.some((item) => Number(item.id) === Number(supportMessage.rows[0].id)), "Support role can view support inbox");
  result = await api("/api/contact", { method: "POST", cookie: memberCookie, body: {
    firstName: "Alex", lastName: "Morgan", email: "ALEX@example.com", confirmEmail: "alex@example.com",
    phone: "+1 708 669 9544", addressLine1: "100 Main Street", addressLine2: "", city: "Chicago",
    stateRegion: "Illinois", postalCode: "60601", country: "US", preferredLanguage: "English",
    secondaryLanguage: "", preferredContactMethods: ["Email", "Telegram", "WhatsApp"],
    telegramHandle: "@alex", whatsappNumber: "+1 555 0100", subject: "Integration contact request",
    message: "Please send information about the official membership process.", smsConsent: true, legalConsent: true,
    item_6__fluent_sf: "",
  } });
  assert(result.response.status === 201 && result.data.submissionId, "Contact form stores a valid request and consent choices");
  const contactRow = await pool.query("SELECT id,email,country,preferred_language,preferred_contact_methods,telegram_handle,whatsapp_number,sms_consent,legal_consent FROM contact_submissions WHERE id=$1", [result.data.submissionId]);
  assert(contactRow.rows[0].email === "alex@example.com" && contactRow.rows[0].country === "US" && contactRow.rows[0].preferred_language === "English" && contactRow.rows[0].preferred_contact_methods.join(",") === "Email,Telegram,WhatsApp", "Contact request normalizes email and stores exact country, language and independent contact channels");
  assert(contactRow.rows[0].sms_consent === true && contactRow.rows[0].legal_consent === true, "Contact request persists SMS and legal consent independently");
  result = await api("/api/admin/contact-submissions", { cookie: memberTwoCookie });
  assert(result.response.status === 200 && result.data.submissions.some((item) => Number(item.id) === Number(contactRow.rows[0].id) && item.preferred_contact_methods.includes("WhatsApp")), "Support role can review contact requests and their selected channels");
  const contactCountBeforeHoneypot = await pool.query("SELECT COUNT(*)::int AS count FROM contact_submissions");
  result = await api("/api/contact", { method: "POST", body: {
    firstName: "Bot", lastName: "Submission", email: "bot@example.com", confirmEmail: "bot@example.com",
    phone: "+1 555 0100", addressLine1: "100 Main Street", city: "Chicago", stateRegion: "Illinois",
    postalCode: "60601", country: "US", preferredLanguage: "English", preferredContactMethods: [],
    subject: "Spam test", message: "This is a honeypot integration test message.", legalConsent: true,
    item_6__fluent_sf: "https://spam.example",
  } });
  assert(result.response.status === 202, "Filled contact honeypot is silently acknowledged without exposing bot detection");
  const contactCountAfterHoneypot = await pool.query("SELECT COUNT(*)::int AS count FROM contact_submissions");
  assert(contactCountBeforeHoneypot.rows[0].count === contactCountAfterHoneypot.rows[0].count, "Honeypot submission is not persisted");
  result = await api(`/api/admin/support/messages/${Number(supportMessage.rows[0].id)}/replies`, { method: "POST", cookie: memberTwoCookie, body: { body: "Support team reply from integration test." } });
  assert(result.response.status === 201, "Support staff can reply to a member");
  result = await api("/api/support/messages", { cookie: memberCookie });
  assert(result.response.status === 200 && result.data.messages[0].replies.length === 1, "Member can read support replies");

  result = await api(`/api/admin/users/${memberTwoId}/roles`, { method: "POST", cookie: adminCookie, body: { role: "instructor" } });
  assert(result.response.status === 201, "Admin can grant the instructor role");
  result = await api("/api/storage/complete", { method: "POST", cookie: memberTwoCookie, body: { assetId: Number(upload.data.assetId) } });
  assert(result.response.status === 404, "An instructor cannot finalize another user's stored asset");
  result = await api(`/api/admin/courses/${membersCourseId}/instructors`, { method: "POST", cookie: adminCookie, body: { userId: memberTwoId } });
  assert(result.response.status === 201, "Admin can assign an instructor to a course");
  result = await api("/api/admin/courses", { cookie: memberTwoCookie });
  assert(result.response.status === 200 && result.data.courses.length === 1 && Number(result.data.courses[0].id) === membersCourseId, "Instructor only sees assigned courses");
  result = await api(`/api/admin/courses/${courseId}/sections`, { method: "POST", cookie: memberTwoCookie, body: { title: "Unauthorized section" } });
  assert(result.response.status === 403, "Instructor cannot edit another instructor's course");

  result = await api(`/api/admin/users/${memberTwoId}/roles`, { method: "POST", cookie: adminCookie, body: { role: "finance" } });
  assert(result.response.status === 201, "Admin can grant the finance role");
  result = await api("/api/admin/finance", { cookie: memberTwoCookie });
  assert(result.response.status === 200, "Finance role can view financial reports");
  result = await api("/api/admin/affiliates", { cookie: memberTwoCookie });
  assert(result.response.status === 200 && result.data.permissions.financeAccess && !result.data.permissions.affiliateAccess && result.data.accounts.length === 0, "Finance role receives payout data but not affiliate management data");
  result = await api("/api/admin/commission-rules", { cookie: memberTwoCookie });
  assert(result.response.status === 403, "Finance role cannot manage affiliate commission rules");

  result = await api("/api/affiliate/apply", { method: "POST", cookie: memberCookie });
  assert(result.response.status === 201, "Member can apply to become an affiliate");
  const affiliate = await pool.query("SELECT id,referral_code FROM affiliate_accounts WHERE user_id=$1", [memberId]);
  const affiliateId = Number(affiliate.rows[0].id);
  result = await api(`/api/admin/affiliates/${affiliateId}`, { method: "PATCH", cookie: adminCookie, body: { status: "active" } });
  assert(result.response.status === 200, "Admin can approve an affiliate account");
  result = await api("/api/referrals/visit", { method: "POST", body: { referralCode: affiliate.rows[0].referral_code, path: "/register" } });
  assert(result.response.status === 200 && result.data.tracked, "Affiliate referral visits are tracked");
  result = await api("/api/auth/register", { method: "POST", body: { username: "integration-referred", password: "IntegrationReferred!Password2026", referralCode: affiliate.rows[0].referral_code } });
  assert(result.response.status === 201, "New member can register with a valid referral code");
  const referred = await pool.query("SELECT id FROM users WHERE username_normalized='integration-referred'");
  const attribution = await pool.query("SELECT affiliate_id FROM referral_attributions WHERE referred_user_id=$1", [referred.rows[0].id]);
  assert(Number(attribution.rows[0].affiliate_id) === affiliateId, "Referral attribution is persisted for the new member");
  let selfReferralBlocked = false;
  try { await pool.query("INSERT INTO referral_attributions(affiliate_id,referred_user_id,referral_code) SELECT id,user_id,referral_code FROM affiliate_accounts WHERE id=$1", [affiliateId]); }
  catch (error) { selfReferralBlocked = error.code === "23514"; }
  assert(selfReferralBlocked, "Database trigger rejects self-referral attribution");
  result = await api("/api/affiliate/me", { cookie: memberCookie });
  assert(result.response.status === 200 && result.data.attributedMembers === 1 && result.data.clicks === 1, "Affiliate dashboard reports members and visits");
  result = await api(`/api/admin/users/${memberId}/roles`, { method: "POST", cookie: adminCookie, body: { role: "affiliate_manager" } });
  assert(result.response.status === 201, "Admin can grant the affiliate manager role");
  result = await api("/api/admin/affiliates", { cookie: memberCookie });
  assert(result.response.status === 200 && result.data.permissions.affiliateAccess && !result.data.permissions.financeAccess && result.data.accounts.length === 1 && result.data.payouts.length === 0, "Affiliate manager can manage referrals without accessing payout data");
  result = await api("/api/admin/finance", { cookie: memberCookie });
  assert(result.response.status === 403, "Affiliate manager cannot access financial reports");
  result = await api("/api/affiliate/payouts", { method: "POST", cookie: memberCookie, body: { amountMinor: 1000, currency: "EUR", method: "bank_transfer", accountLast4: "1234" } });
  assert(result.response.status === 409, "Affiliate cannot request a payout above available wallet balance");
  await pool.query("INSERT INTO affiliate_wallet_entries(affiliate_id,entry_type,amount_minor,currency,description) VALUES($1,'credit',2000,'EUR','Integration payout seed')", [affiliateId]);
  result = await api("/api/affiliate/payouts", { method: "POST", cookie: memberCookie, body: { amountMinor: 1000, currency: "EUR", method: "bank_transfer", accountLast4: "1234" } });
  assert(result.response.status === 201, "Affiliate can reserve an available wallet balance for payout");
  const payoutId = Number(result.data.payout.id);
  result = await api(`/api/admin/affiliate-payouts/${payoutId}`, { method: "PATCH", cookie: adminCookie, body: { status: "approved" } });
  assert(result.response.status === 200, "Finance user can approve an affiliate payout");
  result = await api(`/api/admin/affiliate-payouts/${payoutId}`, { method: "PATCH", cookie: adminCookie, body: { status: "paid", paidReference: "GIN-TRANSFER-ADMIN-001" } });
  assert(result.response.status === 409, "Payout approver cannot mark the same payout as paid");
  result = await api(`/api/admin/affiliate-payouts/${payoutId}`, { method: "PATCH", cookie: memberTwoCookie, body: { status: "paid", paidReference: "GIN-TRANSFER-FINANCE-002" } });
  assert(result.response.status === 200, "A different finance user can mark an approved payout as paid");
  const payoutAudit = await pool.query("SELECT status,approved_by,paid_by FROM affiliate_payouts WHERE id=$1", [payoutId]);
  assert(payoutAudit.rows[0].status === "paid" && Number(payoutAudit.rows[0].approved_by) !== Number(payoutAudit.rows[0].paid_by), "Payout approval and payment are recorded under different actors");

  result = await api(`/api/admin/users/${memberTwoId}/roles`, { method: "POST", cookie: adminCookie, body: { role: "event_manager" } });
  assert(result.response.status === 201, "Admin can grant the event manager role");
  const authenticatedWorkspacePages = [
    ["/fa/finance-center", "fa", "rtl", memberTwoCookie], ["/en/finance-center", "en", "ltr", memberTwoCookie],
    ["/fa/support-center", "fa", "rtl", memberTwoCookie], ["/en/support-center", "en", "ltr", memberTwoCookie],
    ["/fa/instructor", "fa", "rtl", memberTwoCookie], ["/en/instructor", "en", "ltr", memberTwoCookie],
    ["/fa/events-manager", "fa", "rtl", memberTwoCookie], ["/en/events-manager", "en", "ltr", memberTwoCookie],
    ["/fa/affiliate", "fa", "rtl", memberCookie], ["/en/affiliate", "en", "ltr", memberCookie],
    ["/fa/profile", "fa", "rtl", memberCookie], ["/en/profile", "en", "ltr", memberCookie],
    ["/fa/membership", "fa", "rtl", memberCookie], ["/en/portal-membership", "en", "ltr", memberCookie],
  ];
  for (const [path, locale, direction, cookie] of authenticatedWorkspacePages) {
    const oppositeCookie = locale === "en" ? "fa" : "en";
    const response = await fetch(`${baseUrl}${path}`, { redirect: "manual", headers: { cookie: `${cookie}; gin_locale=${oppositeCookie}` } });
    const html = await response.text();
    assert(response.status === 200 && html.includes(`lang="${locale}"`) && html.includes(`dir="${direction}"`) && html.includes("<main"), `Role-authorized workspace ${path} renders in its explicit locale despite an opposing cookie (HTTP ${response.status})`);
  }
  await runAuthenticatedBrowserQa([
    { path: "/fa/admin", locale: "fa", cookie: adminCookie, capture: "fa-admin" },
    { path: "/en/admin", locale: "en", cookie: adminCookie, capture: "en-admin" },
    { path: "/fa/finance-center", locale: "fa", cookie: memberTwoCookie, capture: "fa-finance-center" },
    { path: "/en/finance-center", locale: "en", cookie: memberTwoCookie, capture: "en-finance-center" },
    { path: "/fa/support-center", locale: "fa", cookie: memberTwoCookie, capture: "fa-support-center" },
    { path: "/en/support-center", locale: "en", cookie: memberTwoCookie, capture: "en-support-center" },
    { path: "/fa/instructor", locale: "fa", cookie: memberTwoCookie, capture: "fa-instructor" },
    { path: "/en/instructor", locale: "en", cookie: memberTwoCookie, capture: "en-instructor" },
    { path: "/fa/events-manager", locale: "fa", cookie: memberTwoCookie },
    { path: "/en/events-manager", locale: "en", cookie: memberTwoCookie },
    { path: "/fa/affiliate", locale: "fa", cookie: memberCookie },
    { path: "/en/affiliate", locale: "en", cookie: memberCookie },
    { path: "/fa/dashboard", locale: "fa", cookie: memberTwoCookie, expectedPath: "/fa/finance-center" },
    { path: "/en/dashboard", locale: "en", cookie: memberTwoCookie, expectedPath: "/en/finance-center" },
    { path: "/fa/profile", locale: "fa", cookie: memberCookie },
    { path: "/en/profile", locale: "en", cookie: memberCookie },
    { path: "/fa/membership", locale: "fa", cookie: memberCookie },
    { path: "/en/portal-membership", locale: "en", cookie: memberCookie },
    { path: `/fa/courses/integration-course/assessments/${assessmentId}`, locale: "fa", cookie: memberCookie, capture: "fa-assessment" },
    { path: `/en/courses/integration-course/assessments/${assessmentId}`, locale: "en", cookie: memberCookie, capture: "en-assessment" },
    { path: `/fa/courses/integration-course/lessons/${lessonId}`, locale: "fa", cookie: memberCookie, capture: "fa-lesson" },
    { path: `/en/courses/integration-course/lessons/${lessonId}`, locale: "en", cookie: memberCookie, capture: "en-lesson" },
  ]);
  const refundPlan = await pool.query(`INSERT INTO membership_plans(code,name,level,price_minor,currency,billing_interval)
    VALUES('integration-refund','Refund integration plan',5,5000,'EUR','month') RETURNING id`);
  const refundPlanId = Number(refundPlan.rows[0].id);
  await pool.query("INSERT INTO membership_plan_courses(plan_id,course_id) VALUES($1,$2)", [refundPlanId,membersCourseId]);
  const refundOrder = await pool.query(`INSERT INTO orders(user_id,status,currency,subtotal_minor,discount_minor,total_minor,idempotency_key,description)
    VALUES($1,'paid','EUR',5000,0,5000,'integration-refund-order-001','Refund integration order') RETURNING id`, [referred.rows[0].id]);
  const refundOrderId = Number(refundOrder.rows[0].id);
  const refundItem = await pool.query(`INSERT INTO order_items(order_id,item_type,item_id,title_snapshot,quantity,unit_amount_minor,total_amount_minor)
    VALUES($1,'course',$2,'Refunded course',1,5000,5000) RETURNING id`, [refundOrderId,courseId]);
  const refundTransaction = await pool.query(`INSERT INTO payment_transactions(order_id,provider,provider_reference,idempotency_key,status,amount_minor,currency)
    VALUES($1,'test','integration-refund-reference','integration-refund-tx-001','refunded',5000,'EUR') RETURNING id`, [refundOrderId]);
  await pool.query(`INSERT INTO course_enrollments(course_id,user_id,status,source,source_order_id)
    VALUES($1,$2,'active','purchase',$3)`, [courseId,referred.rows[0].id,refundOrderId]);
  await pool.query(`INSERT INTO memberships(user_id,plan_id,status,starts_at,ends_at,source,provider,source_order_id)
    VALUES($1,$2,'active',NOW(),NOW()+INTERVAL '1 month','payment','test',$3)`, [referred.rows[0].id,refundPlanId,refundOrderId]);
  await pool.query(`INSERT INTO course_enrollments(course_id,user_id,status,source)
    VALUES($1,$2,'active','subscription')`, [membersCourseId,referred.rows[0].id]);
  const refundCommission = await pool.query(`INSERT INTO affiliate_commissions(affiliate_id,referred_user_id,order_id,order_item_id,amount_minor,currency,status)
    VALUES($1,$2,$3,$4,500,'EUR','available') RETURNING id`, [affiliateId,referred.rows[0].id,refundOrderId,refundItem.rows[0].id]);
  await pool.query(`INSERT INTO affiliate_wallet_entries(affiliate_id,commission_id,entry_type,amount_minor,currency,description)
    VALUES($1,$2,'credit',500,'EUR','Refund test commission')`, [affiliateId,refundCommission.rows[0].id]);
  const refundClient = await pool.connect();
  let refundResult;
  try {
    await refundClient.query("BEGIN");
    refundResult = await applyFullRefundEffects(refundClient, {
      transactionId: Number(refundTransaction.rows[0].id), orderId: refundOrderId,
      providerRefundId: "integration-provider-refund-001", amountMinor: 5000, currency: "EUR",
    });
    await refundClient.query("COMMIT");
    await refundClient.query("BEGIN");
    const duplicateRefund = await applyFullRefundEffects(refundClient, {
      transactionId: Number(refundTransaction.rows[0].id), orderId: refundOrderId,
      providerRefundId: "integration-provider-refund-001", amountMinor: 5000, currency: "EUR",
    });
    assert(duplicateRefund.duplicate, "Repeated provider refund reference is idempotent");
    await refundClient.query("COMMIT");
  } catch (error) {
    await refundClient.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    refundClient.release();
  }
  assert(!refundResult.duplicate, "First full refund is applied");
  const refundState = await pool.query(`SELECT
    (SELECT status FROM orders WHERE id=$1) AS order_status,
    (SELECT status FROM affiliate_commissions WHERE id=$2) AS commission_status,
    (SELECT COUNT(*)::int FROM payment_refunds WHERE payment_transaction_id=$3) AS refund_count,
    (SELECT COALESCE(SUM(CASE WHEN entry_type='credit' THEN amount_minor ELSE -amount_minor END),0)::int FROM affiliate_wallet_entries WHERE commission_id=$2) AS commission_balance,
    (SELECT status FROM course_enrollments WHERE course_id=$4 AND user_id=$5) AS purchase_enrollment_status,
    (SELECT status FROM memberships WHERE source_order_id=$1) AS membership_status,
    (SELECT status FROM course_enrollments WHERE course_id=$6 AND user_id=$5) AS subscription_enrollment_status`,
  [refundOrderId,refundCommission.rows[0].id,refundTransaction.rows[0].id,courseId,referred.rows[0].id,membersCourseId]);
  assert(refundState.rows[0].order_status === "refunded" && refundState.rows[0].refund_count === 1, "Full refund is recorded once and marks its order refunded");
  assert(refundState.rows[0].commission_status === "reversed" && refundState.rows[0].commission_balance === 0, "Refund reverses an already-credited commission exactly once");
  assert(refundState.rows[0].purchase_enrollment_status === "revoked", "Refund revokes the purchased course entitlement");
  assert(refundState.rows[0].membership_status === "canceled" && refundState.rows[0].subscription_enrollment_status === "revoked", "Refund cancels the purchased membership and reconciles mapped course access");

  const webhookOrder = await pool.query(`INSERT INTO orders(user_id,status,currency,subtotal_minor,discount_minor,total_minor,idempotency_key,description)
    VALUES($1,'pending','EUR',1200,0,1200,'integration-webhook-retry-order-001','Webhook retry integration order') RETURNING id`, [memberId]);
  const webhookOrderId = Number(webhookOrder.rows[0].id);
  const webhookTransaction = await pool.query(`INSERT INTO payment_transactions(order_id,provider,provider_reference,idempotency_key,status,amount_minor,currency)
    VALUES($1,'integration-test',NULL,'integration-webhook-retry-tx-001','pending',1200,'EUR') RETURNING id`, [webhookOrderId]);
  const webhookTransactionId = Number(webhookTransaction.rows[0].id);
  const retryableEvent = { eventId: "integration-webhook-event-retry-001", eventType: "payment.succeeded", transactionReference: "integration-webhook-reference-001", outcome: "succeeded", amountMinor: 1200, currency: "EUR" };
  const firstWebhookAttempt = await runVerifiedWebhook(retryableEvent);
  assert(firstWebhookAttempt.retryable, "A verified webhook arriving before provider_reference is persisted remains retryable");
  const pendingWebhookEvent = await pool.query("SELECT status,processed_at FROM payment_webhook_events WHERE provider='integration-test' AND provider_event_id=$1", [retryableEvent.eventId]);
  assert(pendingWebhookEvent.rows[0].status === "retryable" && pendingWebhookEvent.rows[0].processed_at === null, "An unmatched webhook is stored without being terminally acknowledged");
  const preRetryPaymentState = await pool.query(`SELECT o.status AS order_status,pt.status AS transaction_status,
    (SELECT COUNT(*)::int FROM invoices WHERE order_id=o.id) AS invoice_count
    FROM orders o JOIN payment_transactions pt ON pt.order_id=o.id WHERE o.id=$1`, [webhookOrderId]);
  assert(preRetryPaymentState.rows[0].order_status === "pending" && preRetryPaymentState.rows[0].transaction_status === "pending" && preRetryPaymentState.rows[0].invoice_count === 0, "A webhook without a matching provider reference cannot partially fulfill an order");
  await pool.query("UPDATE payment_transactions SET provider_reference=$1 WHERE id=$2", [retryableEvent.transactionReference,webhookTransactionId]);
  const retriedWebhook = await runVerifiedWebhook(retryableEvent);
  assert(retriedWebhook.processed && retriedWebhook.status === "succeeded", "Replaying the same event after provider_reference appears completes payment processing");
  const duplicateWebhook = await runVerifiedWebhook(retryableEvent);
  assert(duplicateWebhook.duplicate, "A processed webhook event remains idempotent on subsequent delivery");
  const webhookOrderState = await pool.query(`SELECT o.status AS order_status,pt.status AS transaction_status,pwe.status AS event_status,
    (SELECT COUNT(*)::int FROM invoices WHERE order_id=o.id) AS invoice_count
    FROM orders o JOIN payment_transactions pt ON pt.order_id=o.id
    JOIN payment_webhook_events pwe ON pwe.provider_event_id=$2 AND pwe.provider='integration-test'
    WHERE o.id=$1`, [webhookOrderId,retryableEvent.eventId]);
  assert(webhookOrderState.rows[0].order_status === "paid" && webhookOrderState.rows[0].transaction_status === "succeeded" && webhookOrderState.rows[0].event_status === "processed" && webhookOrderState.rows[0].invoice_count === 1, "Webhook retry fulfills the order exactly once");

  const payloadOrder = await pool.query(`INSERT INTO orders(user_id,status,currency,subtotal_minor,discount_minor,total_minor,idempotency_key,description)
    VALUES($1,'pending','EUR',1300,0,1300,'integration-webhook-payload-order-001','Webhook payload lock order') RETURNING id`, [memberId]);
  const payloadTransaction = await pool.query(`INSERT INTO payment_transactions(order_id,provider,provider_reference,idempotency_key,status,amount_minor,currency)
    VALUES($1,'integration-test',NULL,'integration-webhook-payload-tx-001','pending',1300,'EUR') RETURNING id`, [payloadOrder.rows[0].id]);
  const payloadEvent = { eventId: "integration-webhook-event-payload-001", eventType: "payment.succeeded", transactionReference: "integration-webhook-reference-payload-001", outcome: "succeeded", amountMinor: 1300, currency: "EUR" };
  const payloadFirst = await runVerifiedWebhook(payloadEvent);
  assert(payloadFirst.retryable, "The payload-lock fixture begins in retryable state");
  const alteredPayload = await runVerifiedWebhook({ ...payloadEvent, amountMinor: 1301 });
  assert(alteredPayload.conflict, "A repeated event ID cannot replace its original verified amount");
  await pool.query("UPDATE payment_transactions SET provider_reference=$1 WHERE id=$2", [payloadEvent.transactionReference,payloadTransaction.rows[0].id]);
  const payloadRetry = await runVerifiedWebhook(payloadEvent);
  assert(payloadRetry.processed, "The original immutable payload remains eligible for retry");

  const mismatchOrder = await pool.query(`INSERT INTO orders(user_id,status,currency,subtotal_minor,discount_minor,total_minor,idempotency_key,description)
    VALUES($1,'pending','EUR',1400,0,1400,'integration-webhook-mismatch-order-001','Webhook mismatch order') RETURNING id`, [memberId]);
  await pool.query(`INSERT INTO payment_transactions(order_id,provider,provider_reference,idempotency_key,status,amount_minor,currency)
    VALUES($1,'integration-test','integration-webhook-reference-mismatch-001','integration-webhook-mismatch-tx-001','pending',1400,'EUR')`, [mismatchOrder.rows[0].id]);
  const mismatchEvent = { eventId: "integration-webhook-event-mismatch-001", eventType: "payment.succeeded", transactionReference: "integration-webhook-reference-mismatch-001", outcome: "succeeded", amountMinor: 1401, currency: "EUR" };
  const mismatchResult = await runVerifiedWebhook(mismatchEvent);
  assert(mismatchResult.mismatch, "A verified webhook with an amount mismatch is rejected terminally");
  const mismatchReplay = await runVerifiedWebhook(mismatchEvent);
  assert(mismatchReplay.duplicate, "A terminally rejected amount-mismatch event cannot be applied by replay");

  const orderCountBeforeCheckout = await pool.query("SELECT COUNT(*)::int AS count FROM orders");
  result = await api("/api/checkout", { method: "POST", cookie: memberCookie, body: { itemType: "course", itemId: membersCourseId, idempotencyKey: "integration-checkout-key-0001" } });
  assert(result.response.status === 503 && result.data.code === "PAYMENT_PROVIDER_NOT_CONFIGURED", "Checkout stays disabled without a selected payment provider");
  const webhookCountBeforeDisabledProvider = await pool.query("SELECT COUNT(*)::int AS count FROM payment_webhook_events");
  result = await api("/api/webhooks/payments/stripe", { method: "POST", body: { id: "evt_disabled_provider_integration" } });
  const webhookCountAfterDisabledProvider = await pool.query("SELECT COUNT(*)::int AS count FROM payment_webhook_events");
  assert(result.response.status === 503 && webhookCountBeforeDisabledProvider.rows[0].count === webhookCountAfterDisabledProvider.rows[0].count, "Payment webhook processing remains disabled and stores no events without a configured provider adapter");
  const orderCountAfterCheckout = await pool.query("SELECT COUNT(*)::int AS count FROM orders");
  assert(orderCountBeforeCheckout.rows[0].count === orderCountAfterCheckout.rows[0].count, "Unconfigured checkout creates no fake order or transaction");
  result = await api("/api/notifications", { cookie: memberTwoCookie });
  assert(result.response.status === 200 && result.data.notifications.some((item) => item.type === "event_waitlist_promoted"), "Members receive event waitlist promotion notifications");

  result = await api("/api/admin/courses", { method: "POST", body: { title: "CSRF blocked", slug: "csrf-blocked" } });
  assert(result.response.status === 403, "Cross-origin state-changing requests are rejected");
  await pool.query("UPDATE users SET token_version=token_version+1 WHERE id=$1", [memberId]);
  result = await api("/api/profile", { cookie: memberCookie });
  assert(result.response.status === 401, "Incrementing a user's token version immediately revokes existing sessions");

  const counts = await pool.query(`SELECT
    (SELECT COUNT(*)::int FROM schema_migrations) AS migrations,
    (SELECT COUNT(*)::int FROM course_enrollments WHERE user_id=$1 AND status='completed') AS completed_enrollments,
    (SELECT COUNT(*)::int FROM lesson_progress WHERE user_id=$1 AND status='completed') AS completed_lessons,
    (SELECT COUNT(*)::int FROM certificates WHERE user_id=$1) AS certificates,
    (SELECT COUNT(*)::int FROM assessment_attempts WHERE user_id=$1 AND status='graded' AND passed=TRUE) AS passed_assessments,
    (SELECT COUNT(*)::int FROM memberships WHERE user_id=$1 AND status='active') AS active_memberships,
    (SELECT COUNT(*)::int FROM memberships WHERE user_id=$1 AND status='canceled') AS canceled_memberships,
    (SELECT COUNT(*)::int FROM referral_attributions WHERE affiliate_id=$2) AS referral_attributions,
    (SELECT COUNT(*)::int FROM affiliate_clicks WHERE affiliate_id=$2) AS affiliate_clicks,
    (SELECT COUNT(*)::int FROM support_replies sr JOIN support_messages sm ON sm.id=sr.message_id WHERE sm.user_id=$1 AND sr.is_staff=TRUE) AS support_replies,
    (SELECT COUNT(*)::int FROM contact_submissions) AS contact_submissions` , [memberId,affiliateId]);
  assert(counts.rows[0].migrations === migrationFiles.length, "Exactly all versioned SQL migrations are recorded once");
  assert(counts.rows[0].completed_enrollments === 1 && counts.rows[0].completed_lessons === 1, "Enrollment and progress persisted in PostgreSQL-compatible database");
  assert(counts.rows[0].certificates === 1 && counts.rows[0].passed_assessments === 3, "The original objective, concurrent-submission and manually graded assessments are persisted as passed");
  assert(counts.rows[0].active_memberships === 0 && counts.rows[0].canceled_memberships === 2, "Membership upgrade and cancellation history persisted");
  assert(counts.rows[0].referral_attributions === 1 && counts.rows[0].affiliate_clicks === 1, "Affiliate attribution and click tracking persisted");
  assert(counts.rows[0].support_replies === 1, "Support reply persisted");
  assert(counts.rows[0].contact_submissions === 1, "Valid contact request persisted while the honeypot was not");

  console.log(JSON.stringify({ status: "passed", database: "PGlite PostgreSQL-compatible integration server", migrations: counts.rows[0].migrations, flows: ["legacy reference route redirects", "admin bootstrap/login", "atomic admin password-change rate limiting", "authenticated bilingual staff/member HTML routes with opposing locale cookies", "course/section/lesson management", "course publication", "immutable staging-to-final S3 uploads and replay resistance", "conditional copy rejects ETag races", "course-wide assessments with answer-key privacy, autosave/resume, deterministic shuffle, manual grading, enrollment revocation/expiry guards, lock-wait deadline enforcement and concurrent start/save/submit idempotency", "public catalog", "member registration and admin approval", "member login", "free enrollment", "lesson progress", "course completion", "certificate issuance and public verification", "membership plan entitlements", "membership request and admin approval", "scheduled membership activation and expiry reconciliation", "membership upgrade and cancellation", "event publication and registration", "capacity waitlist and automatic promotion", "support inbox and staff reply", "contact submission, consent persistence, support review and honeypot", "instructor RBAC and course isolation", "finance versus affiliate-manager role separation", "affiliate payout reservation and maker-checker settlement", "affiliate application and referral attribution", "self-referral database guard", "affiliate click tracking and wallet balance guard", "full refund reconciliation and idempotent commission reversal", "payment webhook retry after provider reference persistence", "webhook event payload immutability and terminal amount-mismatch handling", "checkout disabled without provider", "notification delivery", "profile updates", "CSRF rejection"] }, null, 2));
  if (process.env.KEEP_INTEGRATION_SERVER === "1") {
    console.log(`Integration server retained for browser QA at ${baseUrl}; press Ctrl+C when finished.`);
    await new Promise((resolve) => process.once("SIGINT", resolve));
  }
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  if (app && app.exitCode === null) {
    if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(app.pid), "/T", "/F"], { stdio: "ignore" });
    else app.kill("SIGTERM");
    await delay(500);
    if (app.exitCode === null) app.kill("SIGKILL");
  }
  await pool?.end().catch(() => undefined);
  await server.stop().catch(() => undefined);
  await new Promise((resolve) => s3Server.close(() => resolve(undefined))).catch(() => undefined);
  await database.close().catch(() => undefined);
}
