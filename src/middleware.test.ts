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
