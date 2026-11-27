import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";

test("explicit locale URLs persist the selected language in a year-long cookie", () => {
  const english = middleware(new NextRequest("https://gin.test/en/contact-us"));
  const persian = middleware(new NextRequest("https://gin.test/fa/contact"));
  assert.match(english.headers.get("set-cookie") ?? "", /gin_locale=en/);
  assert.match(persian.headers.get("set-cookie") ?? "", /gin_locale=fa/);
});

test("the local English member-home route is served directly in English", () => {
  const response = middleware(new NextRequest("https://gin.test/member-home"));
  assert.equal(response.headers.get("x-middleware-request-x-website-locale"), "en");
  assert.equal(response.headers.get("x-middleware-rewrite"), null);
  assert.match(response.headers.get("set-cookie") ?? "", /gin_locale=en/);
});

test("official public locale routes carry their own language without changing portal preference cookies", () => {
  for (const [code, path] of [["de", "/de/home-public"], ["fr", "/fr/home-public"], ["es", "/es/home-public-spanish"], ["hu", "/hu/home-public"], ["sq", "/sq/home-public"], ["pt", "/pt/home-public"]] as const) {
    const response = middleware(new NextRequest(`https://gin.test${path}`, { headers: { cookie: "gin_locale=fa" } }));
    assert.equal(response.headers.get("x-middleware-request-x-website-locale"), code, `${path} should carry ${code}`);
    assert.equal(response.headers.get("x-middleware-rewrite"), null, `${path} should remain a direct route`);
    assert.equal(response.headers.get("set-cookie"), null, `${path} must not overwrite the separate portal locale preference`);
  }
});

test("production locale preference cookies include the Secure attribute", () => {
  const previous = process.env.NODE_ENV;
  Reflect.set(process.env, "NODE_ENV", "production");
  try {
    const response = middleware(new NextRequest("https://gin.test/en"));
    assert.match(response.headers.get("set-cookie") ?? "", /gin_locale=en/);
    assert.match(response.headers.get("set-cookie") ?? "", /; Secure/i);
  } finally {
    if (previous === undefined) Reflect.deleteProperty(process.env, "NODE_ENV");
    else Reflect.set(process.env, "NODE_ENV", previous);
  }
});

test("English preference rewrites matching legacy and staff URLs without changing the public URL", () => {
  const home = middleware(new NextRequest("https://gin.test/", { headers: { cookie: "gin_locale=en" } }));
  const admin = middleware(new NextRequest("https://gin.test/admin", { headers: { cookie: "gin_locale=en" } }));
  assert.equal(home.headers.get("x-middleware-rewrite"), "https://gin.test/en");
  assert.equal(admin.headers.get("x-middleware-rewrite"), "https://gin.test/en/admin");
  assert.equal(home.headers.get("set-cookie"), null);
});

test("explicit Persian URLs override an English cookie and persist Persian", () => {
  const response = middleware(new NextRequest("https://gin.test/fa/admin", { headers: { cookie: "gin_locale=en" } }));
  assert.equal(response.headers.get("x-middleware-rewrite"), "https://gin.test/admin");
  assert.match(response.headers.get("set-cookie") ?? "", /gin_locale=fa/);
});

test("explicit Persian locale survives the internal rewrite pass with an old English cookie", () => {
  const firstPass = middleware(new NextRequest("https://gin.test/fa/contact", { headers: { cookie: "gin_locale=en" } }));
  const secondPass = middleware(new NextRequest("https://gin.test/contact", {
    headers: {
      cookie: "gin_locale=en",
      "x-website-locale": "fa",
      "x-website-path": "/fa/contact",
    },
  }));
  assert.equal(firstPass.headers.get("x-middleware-rewrite"), "https://gin.test/contact");
  assert.equal(secondPass.headers.get("x-middleware-rewrite"), null);
  assert.equal(secondPass.headers.get("x-middleware-request-x-website-locale"), "fa");
});

test("Persian reference routes rewrite to their real root-level pages", () => {
  for (const slug of ["our-events", "our-training", "personal-mastery", "become-a-member", "member-benefits-associate", "privacy-policy", "cookie-policy", "terms-of-use", "member-agreement", "wealth-creation", "financial-independence", "dynamic-health", "happiness", "global-networking", "mentorship", "membership-opportunities", "success-training", "training-courses"]) {
    const response = middleware(new NextRequest(`https://gin.test/fa/${slug}`, { headers: { cookie: "gin_locale=en" } }));
    assert.equal(response.headers.get("x-middleware-rewrite"), `https://gin.test/${slug}`, `/fa/${slug} should resolve to its Persian page`);
    assert.match(response.headers.get("set-cookie") ?? "", /gin_locale=fa/, `/fa/${slug} should persist Persian`);
  }
});

test("English cookie preference resolves Persian reference slugs to their English counterparts", () => {
  for (const slug of ["our-events", "our-training", "personal-mastery", "become-a-member", "member-benefits-associate", "cookie-policy", "terms-of-use", "member-agreement", "wealth-creation", "financial-independence", "dynamic-health", "happiness", "global-networking", "mentorship", "membership-opportunities"]) {
    const response = middleware(new NextRequest(`https://gin.test/${slug}`, { headers: { cookie: "gin_locale=en" } }));
    assert.equal(response.headers.get("x-middleware-rewrite"), `https://gin.test/en/${slug}`, `/${slug} should resolve to its English counterpart`);
  }
  const privacy = middleware(new NextRequest("https://gin.test/privacy-policy", { headers: { cookie: "gin_locale=en" } }));
  assert.equal(privacy.headers.get("x-middleware-rewrite"), "https://gin.test/en/privacy-policy-2");
  for (const alias of ["success-training", "training-courses"]) {
    const response = middleware(new NextRequest(`https://gin.test/${alias}`, { headers: { cookie: "gin_locale=en" } }));
    assert.equal(response.headers.get("x-middleware-rewrite"), "https://gin.test/en/our-training", `/${alias} should resolve to the canonical English training page`);
  }
});
