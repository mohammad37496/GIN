import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { englishProfileError } from "@/lib/english-profile-messages";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("English staff routes render their operational workspaces directly", () => {
  const routes = [
    ["../app/en/admin/page.tsx", ["AdminUsers", "AdminPassword", "AdminCourses", "AdminEvents", "AdminMemberships", "AdminAffiliates", "AdminFinance", "AdminCourseCategories", "AdminAssessments", "AdminSupport", "AdminContactSubmissions"]],
    ["../app/en/finance-center/page.tsx", ["AdminFinance", "AdminAffiliates", "canManageFinance", "canManageAffiliates"]],
    ["../app/en/support-center/page.tsx", ["AdminSupport", "AdminContactSubmissions", 'hasRole(user, "support")']],
    ["../app/en/events-manager/page.tsx", ["AdminEvents", 'hasRole(user, "event_manager")']],
    ["../app/en/instructor/page.tsx", ["AdminCourses", "AdminAssessments", 'hasRole(user, "instructor")']],
    ["../app/en/affiliate/page.tsx", ["AdminAffiliates", "canManageAffiliates", "canManageFinance"]],
  ] as const;
  for (const [path, expected] of routes) {
    const page = source(path);
    for (const token of expected) assert.ok(page.includes(token), `${path} is missing ${token}`);
    assert.ok(page.includes('locale="en"'), `${path} does not render the English staff header`);
    assert.ok(page.includes('lang="en" dir="ltr"'), `${path} does not establish an English LTR workspace`);
    for (const component of expected.filter((token) => token.startsWith("Admin"))) {
      assert.match(page, new RegExp(`<${component}\\b[^>]*locale="en"`), `${path} does not pass locale=en to ${component}`);
    }
    assert.ok(!page.includes("EnglishStaffLanding"), `${path} still links to a Persian landing page`);
  }
});

test("English profile uses English language names and never exposes Persian API errors", () => {
  const profile = source("../components/english-member-controls.tsx");
  assert.ok(profile.includes('<option value="fa">Persian</option>'));
  assert.ok(!profile.includes("فارسی"));
  assert.equal(englishProfileError("این ایمیل قبلاً برای حساب دیگری ثبت شده است.", "Could not save your profile."), "This email address is already in use by another account.");
  assert.equal(englishProfileError("پیام فارسی ناشناخته", "Could not save your profile."), "Could not save your profile.");
});

test("shared operational components default to Persian and expose an explicit locale", () => {
  const components = ["admin-users", "admin-password", "admin-courses", "admin-events", "admin-memberships", "admin-affiliates", "admin-finance", "admin-course-categories", "admin-assessments", "admin-support", "admin-contact-submissions", "lesson-resource-uploader", "course-category-assignment", "membership-plan-course-mapping"];
  for (const component of components) {
    const implementation = source(`../components/${component}.tsx`);
    assert.match(implementation, /locale\s*=\s*"fa"/, `${component} must preserve the Persian default`);
    assert.ok(implementation.includes("StaffLocalized"), `${component} must localize its visible content`);
  }
});

test("Persian staff routes retain their original operational components", () => {
  const expected = [
    ["../app/admin/page.tsx", ["AdminUsers", "AdminPassword", "AdminCourses", "AdminEvents", "AdminMemberships", "AdminAffiliates", "AdminFinance", "AdminSupport"]],
    ["../app/finance-center/page.tsx", ["AdminFinance", "AdminAffiliates"]],
    ["../app/support-center/page.tsx", ["AdminSupport", "AdminContactSubmissions"]],
    ["../app/events-manager/page.tsx", ["AdminEvents"]],
    ["../app/instructor/page.tsx", ["AdminCourses", "AdminAssessments"]],
  ] as const;
  for (const [path, components] of expected) {
    const page = source(path);
    for (const component of components) assert.ok(page.includes(component), `${path} lost ${component}`);
    assert.ok(!page.includes('locale="en"'), `${path} unexpectedly opts into English`);
  }
});

test("staff workspaces are explicitly excluded from search indexing in both locales", () => {
  const routes = [
    "../app/admin/page.tsx", "../app/affiliate/page.tsx", "../app/finance-center/page.tsx",
    "../app/events-manager/page.tsx", "../app/instructor/page.tsx", "../app/support-center/page.tsx",
    "../app/en/admin/page.tsx", "../app/en/affiliate/page.tsx", "../app/en/finance-center/page.tsx",
    "../app/en/events-manager/page.tsx", "../app/en/instructor/page.tsx", "../app/en/support-center/page.tsx",
  ];
  for (const path of routes) {
    assert.match(source(path), /robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/, `${path} must be noindex/nofollow`);
  }
});

test("course and event detail routes publish locale-specific canonical and hreflang metadata", () => {
  for (const path of [
    "../app/courses/[slug]/page.tsx", "../app/en/courses/[slug]/page.tsx",
    "../app/events/[slug]/page.tsx", "../app/en/events/[slug]/page.tsx",
  ]) {
    const page = source(path);
    assert.ok(page.includes("generateMetadata"), `${path} must provide route-specific metadata`);
    assert.ok(page.includes("alternates:"), `${path} must provide canonical/hreflang metadata`);
    assert.ok(page.includes("openGraph:") && page.includes("twitter:"), `${path} must provide social metadata`);
  }
});

test("course and event catalog routes publish locale-specific metadata", () => {
  for (const path of ["../app/courses/page.tsx", "../app/en/courses/page.tsx", "../app/events/page.tsx", "../app/en/events/page.tsx"]) {
    const page = source(path);
    assert.ok(page.includes("metadata"), `${path} must provide route metadata`);
    assert.ok(page.includes("alternates:"), `${path} must provide canonical/hreflang metadata`);
    assert.ok(page.includes("openGraph:") && page.includes("twitter:"), `${path} must provide social metadata`);
  }
});

test("certificate verification is noindex and portal membership metadata is reciprocal", () => {
  assert.match(source("../app/certificates/[publicId]/page.tsx"), /robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/);
  assert.match(source("../app/en/certificates/[publicId]/page.tsx"), /robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/);
  const faMembership = source("../app/membership/page.tsx");
  const enMembership = source("../app/en/portal-membership/page.tsx");
  assert.ok(faMembership.includes('en: "/en/portal-membership"') && faMembership.includes('fa: "/fa/membership"'));
  assert.ok(enMembership.includes('en: "/en/portal-membership"') && enMembership.includes('fa: "/fa/membership"'));
});

test("Persian login and registration layouts are noindex with matching English routes", () => {
  for (const path of ["../app/login/layout.tsx", "../app/register/layout.tsx"]) {
    const layout = source(path);
    assert.match(layout, /robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/);
    assert.ok(layout.includes('fa: "/fa/') && layout.includes('en: "/en/'));
  }
});

test("learner assessment pages are noindex and expose reciprocal language routes", () => {
  const routes = [
    ["../app/courses/[slug]/assessments/[assessmentId]/page.tsx", "fa"],
    ["../app/en/courses/[slug]/assessments/[assessmentId]/page.tsx", "en"],
  ] as const;
  for (const [path, locale] of routes) {
    const page = source(path);
    assert.match(page, /robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/);
    assert.ok(page.includes("alternates:") && page.includes(locale === "en" ? "en: canonical" : "fa: canonical"));
  }
});
