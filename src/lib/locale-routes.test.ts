import assert from "node:assert/strict";
import test from "node:test";
import { englishPathForPersianPath, persianPathForEnglishPath } from "./locale-routes";

test("public information pages switch to their matching language routes", () => {
  assert.equal(englishPathForPersianPath("/fa/about"), "/en/about-us");
  assert.equal(englishPathForPersianPath("/fa/who-we-are"), "/en/who-we-are");
  assert.equal(englishPathForPersianPath("/fa/success-system"), "/en/the-gin-success-system");
  assert.equal(persianPathForEnglishPath("/en/about-us"), "/fa/about");
  assert.equal(persianPathForEnglishPath("/en/the-gin-success-system"), "/fa/success-system");
  assert.equal(englishPathForPersianPath("/fa/membership-levels"), "/en/membership-levels");
  assert.equal(persianPathForEnglishPath("/en/membership-levels"), "/fa/membership-levels");
  assert.equal(englishPathForPersianPath("/fa/membership"), "/en/portal-membership");
  assert.equal(persianPathForEnglishPath("/en/portal-membership"), "/fa/membership");
});

test("course and lesson language switching preserves the selected resource", () => {
  assert.equal(englishPathForPersianPath("/fa/courses/financial-literacy"), "/en/courses/financial-literacy");
  assert.equal(englishPathForPersianPath("/courses/financial-literacy/lessons/42"), "/en/courses/financial-literacy/lessons/42");
  assert.equal(persianPathForEnglishPath("/en/courses/financial-literacy/lessons/42"), "/fa/courses/financial-literacy/lessons/42");
});

test("course assessment language switching preserves the selected assessment", () => {
  assert.equal(englishPathForPersianPath("/fa/courses/financial-literacy/assessments/27"), "/en/courses/financial-literacy/assessments/27");
  assert.equal(persianPathForEnglishPath("/en/courses/financial-literacy/assessments/27"), "/fa/courses/financial-literacy/assessments/27");
});

test("event language switching preserves the selected event", () => {
  assert.equal(englishPathForPersianPath("/fa/events/global-summit"), "/en/events/global-summit");
  assert.equal(persianPathForEnglishPath("/en/events/global-summit"), "/fa/events/global-summit");
});

test("certificate language switching preserves the public verification identifier", () => {
  const id = "a0b1c2d3-e4f5-4678-9abc-def012345678";
  assert.equal(englishPathForPersianPath(`/fa/certificates/${id}`), `/en/certificates/${id}`);
  assert.equal(persianPathForEnglishPath(`/en/certificates/${id}`), `/fa/certificates/${id}`);
});

test("language switcher falls back to the correct homepage when no translation exists", () => {
  assert.equal(englishPathForPersianPath("/unknown-legacy-route"), "/en");
  assert.equal(englishPathForPersianPath("/why-join"), "/en/what-we-offer");
  assert.equal(persianPathForEnglishPath("/en/what-we-offer"), "/fa/what-we-offer");
  assert.equal(persianPathForEnglishPath("/en/unknown-legal-page"), "/fa");
});

test("all nine completed public pages have reciprocal Persian and English routes", () => {
  const slugs = ["our-events", "our-training", "personal-mastery", "become-a-member", "member-benefits-associate", "cookie-policy", "terms-of-use", "member-agreement"];
  for (const slug of slugs) {
    assert.equal(persianPathForEnglishPath(`/en/${slug}`), `/fa/${slug}`);
    assert.equal(englishPathForPersianPath(`/fa/${slug}`), `/en/${slug}`);
    assert.equal(englishPathForPersianPath(`/${slug}`), `/en/${slug}`);
  }
  assert.equal(persianPathForEnglishPath("/en/privacy-policy-2"), "/fa/privacy-policy");
  assert.equal(englishPathForPersianPath("/fa/privacy-policy"), "/en/privacy-policy-2");
  assert.equal(englishPathForPersianPath("/privacy-policy"), "/en/privacy-policy-2");
});

test("wealth, health, networking, mentoring and membership subtopics preserve route equivalents", () => {
  const slugs = ["wealth-creation", "financial-independence", "dynamic-health", "happiness", "global-networking", "mentorship", "membership-opportunities"];
  for (const slug of slugs) {
    assert.equal(persianPathForEnglishPath(`/en/${slug}`), `/fa/${slug}`);
    assert.equal(englishPathForPersianPath(`/fa/${slug}`), `/en/${slug}`);
    assert.equal(englishPathForPersianPath(`/${slug}`), `/en/${slug}`);
  }
  for (const alias of ["success-training", "training-courses"]) {
    assert.equal(persianPathForEnglishPath(`/en/${alias}`), "/fa/our-training");
    assert.equal(englishPathForPersianPath(`/fa/${alias}`), "/en/our-training");
  }
});

test("staff workspace language switching preserves the selected workspace", () => {
  for (const path of ["admin", "instructor", "events-manager", "finance-center", "support-center", "affiliate"]) {
    assert.equal(englishPathForPersianPath(`/fa/${path}`), `/en/${path}`);
    assert.equal(englishPathForPersianPath(`/${path}`), `/en/${path}`);
    assert.equal(persianPathForEnglishPath(`/en/${path}`), `/fa/${path}`);
  }
});
