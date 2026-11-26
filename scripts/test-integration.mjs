import { createHash } from "node:crypto";
import strictAssert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawn, spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import pg from "pg";
import { applyFullRefundEffects } from "../src/lib/payments/refunds.ts";
import { runMigrations } from "../src/lib/migrations.ts";

const { Pool } = pg;
const root = process.cwd();
const database = await PGlite.create();
const server = new PGLiteSocketServer({ db: database, host: "127.0.0.1", port: 55432, maxConnections: 8 });
let app;
let pool;
const baseUrl = "http://127.0.0.1:3100";
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

try {
  await server.start();
  const databaseUrl = `postgresql://postgres:postgres@${server.getServerConn()}/postgres?sslmode=disable`;
  pool = new Pool({ connectionString: databaseUrl, max: 1 });
  await pool.query("SELECT 1");

  app = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", "3100"], {
    cwd: root,
    env: {
      ...process.env,
      NODE_ENV: "production",
      DATABASE_URL: databaseUrl,
      SESSION_SECRET: "integration-test-secret-with-more-than-thirty-two-bytes",
      APP_URL: baseUrl,
      BOOTSTRAP_ADMIN_USERNAME: "integration-admin",
      BOOTSTRAP_ADMIN_PASSWORD: "IntegrationAdmin!Password2026",
      S3_ENDPOINT: "https://s3.integration.invalid",
      S3_BUCKET: "integration",
      S3_ACCESS_KEY_ID: "integration-access-key",
      S3_SECRET_ACCESS_KEY: "integration-secret-key",
    },
    stdio: "inherit",
  });
  await waitForApp();

  const lastMigration = "0014_payment_refund_reconciliation.sql";
  const lastMigrationSql = (await readFile(`${root}/migrations/${lastMigration}`, "utf8")).replace(/\r\n?/g, "\n");
  const lastMigrationChecksum = createHash("sha256").update(lastMigrationSql).digest("hex");
  const baselineMigration = "0001_core.sql";
  const baselineSql = (await readFile(`${root}/migrations/${baselineMigration}`, "utf8")).replace(/\r\n?/g, "\n");
  const baselineChecksum = createHash("sha256").update(baselineSql).digest("hex");

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
  await strictAssert.rejects(runMigrations(pool), /Applied migration 0014_payment_refund_reconciliation\.sql was modified/);
  await pool.query("UPDATE schema_migrations SET checksum=$1 WHERE version=$2", [lastMigrationChecksum, lastMigration]);
  await pool.query("DELETE FROM schema_migrations WHERE version=$1", [baselineMigration]);
  await strictAssert.rejects(runMigrations(pool), new RegExp(`Baseline migration ${baselineMigration} is missing from schema_migrations while later migrations are recorded`));
  await pool.query("INSERT INTO schema_migrations(version,checksum) VALUES($1,$2)", [baselineMigration,baselineChecksum]);
  await runMigrations(pool);

  const legacyRoutes = [
    ["/about-us", "/about"],
    ["/our-training", "/courses"],
    ["/member-benefits-associate", "/member-benefits"],
    ["/our-events", "/events"],
    ["/membership-levels", "/membership"],
    ["/contact-us", "/contact"],
    ["/become-a-member", "/register"],
    ["/gin-hotels", "/hotels"],
    ["/gin-clubhouses", "/clubhouses"],
    ["/gin-cruise-ship", "/cruise"],
  ];
  for (const [path, destination] of legacyRoutes) {
    const response = await fetch(`${baseUrl}${path}`, { redirect: "manual" });
    assert(response.status === 307 && response.headers.get("location") === destination, `Legacy route ${path} redirects to ${destination} (HTTP ${response.status})`);
  }

  let result = await api("/api/auth/login", { method: "POST", body: { username: "integration-admin", password: "IntegrationAdmin!Password2026" } });
  assert(result.response.status === 200 && result.cookie, `Admin login should create an HttpOnly session cookie (HTTP ${result.response.status}: ${JSON.stringify(result.data)})`);
  const adminCookie = result.cookie;

  result = await api("/api/admin/courses", { method: "POST", cookie: adminCookie, body: { title: "Integration Course", slug: "integration-course", summary: "Integration summary", description: "Integration description", accessType: "free", estimatedMinutes: 10 } });
  assert(result.response.status === 201, `Admin can create course (${result.response.status})`);
  const courseId = Number(result.data.course.id);

  result = await api(`/api/admin/courses/${courseId}/sections`, { method: "POST", cookie: adminCookie, body: { title: "First section" } });
  assert(result.response.status === 201, `Admin can add a course section (HTTP ${result.response.status}: ${JSON.stringify(result.data)})`);
  const sectionId = Number(result.data.section.id);

  result = await api(`/api/admin/sections/${sectionId}/lessons`, { method: "POST", cookie: adminCookie, body: { title: "Preview lesson", summary: "Lesson summary", content: "Lesson content", durationSeconds: 120, isPreview: true, status: "published" } });
  assert(result.response.status === 201, "Admin can publish a lesson");
  const lessonId = Number(result.data.lesson.id);

  result = await api(`/api/admin/courses/${courseId}/assessments`, { method: "POST", cookie: adminCookie, body: { title: "Course knowledge check", timeLimitSeconds: 600, maxAttempts: 2, passPercent: 70 } });
  assert(result.response.status === 201, `Admin can create an assessment (HTTP ${result.response.status}: ${JSON.stringify(result.data)})`);
  const assessmentId = Number(result.data.assessment.id);
  result = await api(`/api/admin/assessments/${assessmentId}/questions`, { method: "POST", cookie: adminCookie, body: { questionType: "true_false", prompt: "A course can have lessons.", answerKey: true, points: 1 } });
  assert(result.response.status === 201, `Admin can create a true/false question (HTTP ${result.response.status}: ${JSON.stringify(result.data)})`);
  result = await api(`/api/admin/assessments/${assessmentId}`, { method: "PATCH", cookie: adminCookie, body: { status: "published" } });
  assert(result.response.status === 200, `Assessment publishes after a question exists (HTTP ${result.response.status}: ${JSON.stringify(result.data)})`);

  result = await api(`/api/admin/courses/${courseId}`, { method: "PATCH", cookie: adminCookie, body: { status: "published" } });
  assert(result.response.status === 200, `Course publishes only after a published lesson exists (HTTP ${result.response.status}: ${JSON.stringify(result.data)})`);
  result = await api(`/api/lessons/${lessonId}/resources`);
  assert(result.response.status === 200 && Array.isArray(result.data.resources), `Anonymous visitors can read resources attached to a published preview lesson (HTTP ${result.response.status}: ${JSON.stringify(result.data)})`);

  result = await api("/api/courses");
  assert(result.response.status === 200 && result.data.courses.some((course) => course.slug === "integration-course"), "Published course appears in public catalog");

  result = await api("/api/auth/register", { method: "POST", body: { username: "integration-member", password: "IntegrationMember!Password2026" } });
  assert(result.response.status === 201, "Member can request an account");
  const member = await pool.query("SELECT id FROM users WHERE username_normalized='integration-member'");
  const memberId = Number(member.rows[0].id);

  result = await api("/api/admin/users", { method: "PATCH", cookie: adminCookie, body: { id: memberId, status: "approved" } });
  assert(result.response.status === 200, "Admin can approve a pending member");
  await pool.query("INSERT INTO user_roles(user_id,role) VALUES($1,'instructor')", [memberId]);

  result = await api("/api/auth/login", { method: "POST", body: { username: "integration-member", password: "IntegrationMember!Password2026" } });
  assert(result.response.status === 200 && result.cookie && result.data.redirectTo === "/instructor", "Approved instructors are sent to their staff workspace after login");
  const memberCookie = result.cookie;

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
  assert(result.response.status === 200 && result.data.questions.length === 1 && !("answer_key" in result.data.questions[0]), "Member sees questions without answer keys");
  result = await api(`/api/assessments/${assessmentId}/attempts`, { method: "POST", cookie: memberCookie, body: {} });
  assert(result.response.status === 201, `Member can start a timed assessment attempt (HTTP ${result.response.status}: ${JSON.stringify(result.data)})`);
  const attemptId = Number(result.data.attempt.id);
  const questionId = Number(result.data.questions[0].id);
  result = await api(`/api/assessment-attempts/${attemptId}/submit`, { method: "POST", cookie: memberCookie, body: { answers: [{ questionId, answer: true }] } });
  assert(result.response.status === 200 && result.data.passed && result.data.courseCompleted, `Passing the required assessment completes the course (HTTP ${result.response.status}: ${JSON.stringify(result.data)})`);

  result = await api(`/api/courses/integration-course/certificate`, { method: "POST", cookie: memberCookie, body: {} });
  assert(result.response.status === 201 && result.data.certificate.serial_number, `Member can issue a certificate after completing lessons and assessments (HTTP ${result.response.status}: ${JSON.stringify(result.data)})`);
  const certificateId = result.data.certificate.public_id;
  result = await api(`/api/certificates/${certificateId}`);
  assert(result.response.status === 200 && result.data.certificate.valid, "Certificate has a public verification endpoint");

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

  result = await api("/api/admin/events", { method: "POST", cookie: adminCookie, body: { slug: "integration-event", title: "Integration Community Event", summary: "Capacity and waitlist test", description: "Integration event", location: "Online", startsAt: new Date(Date.now()+86400000).toISOString(), endsAt: new Date(Date.now()+90000000).toISOString(), capacity: 1, accessType: "public", priceMinor: 0 } });
  assert(result.response.status === 201, `Admin can create an event (HTTP ${result.response.status}: ${JSON.stringify(result.data)})`);
  const eventId = Number(result.data.event.id);
  result = await api(`/api/admin/events/${eventId}`, { method: "PATCH", cookie: adminCookie, body: { status: "published" } });
  assert(result.response.status === 200, "Admin can publish an event");
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

  result = await api("/api/admin/membership-plans", { method: "POST", cookie: adminCookie, body: { code: "integration-member-plus", name: "Integration Member Plus", level: 2, priceMinor: 0, billingInterval: "none", benefits: ["Expanded member access"] } });
  assert(result.response.status === 201, "Admin can create a second membership tier");
  const higherPlanId = Number(result.data.plan.id);
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
  result = await api(`/api/admin/support/messages/${Number(supportMessage.rows[0].id)}/replies`, { method: "POST", cookie: memberTwoCookie, body: { body: "Support team reply from integration test." } });
  assert(result.response.status === 201, "Support staff can reply to a member");
  result = await api("/api/support/messages", { cookie: memberCookie });
  assert(result.response.status === 200 && result.data.messages[0].replies.length === 1, "Member can read support replies");

  result = await api(`/api/admin/users/${memberTwoId}/roles`, { method: "POST", cookie: adminCookie, body: { role: "instructor" } });
  assert(result.response.status === 201, "Admin can grant the instructor role");
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

  const orderCountBeforeCheckout = await pool.query("SELECT COUNT(*)::int AS count FROM orders");
  result = await api("/api/checkout", { method: "POST", cookie: memberCookie, body: { itemType: "course", itemId: membersCourseId, idempotencyKey: "integration-checkout-key-0001" } });
  assert(result.response.status === 503 && result.data.code === "PAYMENT_PROVIDER_NOT_CONFIGURED", "Checkout stays disabled without a selected payment provider");
  const orderCountAfterCheckout = await pool.query("SELECT COUNT(*)::int AS count FROM orders");
  assert(orderCountBeforeCheckout.rows[0].count === orderCountAfterCheckout.rows[0].count, "Unconfigured checkout creates no fake order or transaction");
  result = await api("/api/notifications", { cookie: memberTwoCookie });
  assert(result.response.status === 200 && result.data.notifications.some((item) => item.type === "event_waitlist_promoted"), "Members receive event waitlist promotion notifications");

  result = await api("/api/admin/courses", { method: "POST", body: { title: "CSRF blocked", slug: "csrf-blocked" } });
  assert(result.response.status === 403, "Cross-origin state-changing requests are rejected");

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
    (SELECT COUNT(*)::int FROM support_replies sr JOIN support_messages sm ON sm.id=sr.message_id WHERE sm.user_id=$1 AND sr.is_staff=TRUE) AS support_replies`, [memberId,affiliateId]);
  assert(counts.rows[0].migrations >= 14, "All versioned SQL migrations are recorded");
  assert(counts.rows[0].completed_enrollments === 1 && counts.rows[0].completed_lessons === 1, "Enrollment and progress persisted in PostgreSQL-compatible database");
  assert(counts.rows[0].certificates === 1 && counts.rows[0].passed_assessments === 1, "Assessment and certificate records persisted");
  assert(counts.rows[0].active_memberships === 0 && counts.rows[0].canceled_memberships === 2, "Membership upgrade and cancellation history persisted");
  assert(counts.rows[0].referral_attributions === 1 && counts.rows[0].affiliate_clicks === 1, "Affiliate attribution and click tracking persisted");
  assert(counts.rows[0].support_replies === 1, "Support reply persisted");

  console.log(JSON.stringify({ status: "passed", database: "PGlite PostgreSQL-compatible integration server", migrations: counts.rows[0].migrations, flows: ["legacy reference route redirects", "admin bootstrap/login", "course/section/lesson management", "course publication", "assessment/question management", "public catalog", "member registration and admin approval", "member login", "free enrollment", "lesson progress", "timed assessment attempt and grading", "course completion", "certificate issuance and public verification", "membership plan entitlements", "membership request and admin approval", "scheduled membership activation and expiry reconciliation", "membership upgrade and cancellation", "event publication and registration", "capacity waitlist and automatic promotion", "support inbox and staff reply", "instructor RBAC and course isolation", "finance versus affiliate-manager role separation", "affiliate payout reservation and maker-checker settlement", "affiliate application and referral attribution", "self-referral database guard", "affiliate click tracking and wallet balance guard", "full refund reconciliation and idempotent commission reversal", "checkout disabled without provider", "notification delivery", "profile updates", "CSRF rejection"] }, null, 2));
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
  await database.close().catch(() => undefined);
}
