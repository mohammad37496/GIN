import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const switcher = readFileSync(new URL("../components/locale-switcher.tsx", import.meta.url), "utf8");

test("locale switcher synchronizes document language, direction, and body locale class after client navigation", () => {
  assert.match(switcher, /const locale = english \? "en" : "fa"/);
  assert.match(switcher, /document\.documentElement\.lang = locale/);
  assert.match(switcher, /document\.documentElement\.dir = locale === "fa" \? "rtl" : "ltr"/);
  assert.match(switcher, /document\.body\.classList\.remove\("locale-fa", "locale-en"\)/);
  assert.match(switcher, /document\.body\.classList\.add\(`locale-\$\{locale\}`\)/);
  assert.match(switcher, /\}, \[english, pathname\]\)/);
  assert.match(switcher, /aria-label=\{english \? "Choose language" : "انتخاب زبان"\}/);
});

test("explicit locale routes override the saved cookie and cookie persistence remains intact", () => {
  assert.match(switcher, /const explicitEnglish = pathname === "\/en" \|\| pathname\.startsWith\("\/en\/"\)/);
  assert.match(switcher, /const explicitPersian = pathname === "\/fa" \|\| pathname\.startsWith\("\/fa\/"\)/);
  assert.match(switcher, /const english = explicitEnglish \|\| \(!explicitPersian && cookieLocale === "en" && hasEnglishCounterpart\(pathname\)\)/);
  assert.match(switcher, /document\.cookie = `gin_locale=\$\{locale\}; Path=\/; Max-Age=31536000; SameSite=Lax/);
  assert.match(switcher, /onClick=\{\(\) => remember\("en"\)\}/);
  assert.match(switcher, /onClick=\{\(\) => remember\("fa"\)\}/);
  assert.match(switcher, /href=\{englishHref\}/);
  assert.match(switcher, /href=\{persianHref\}/);
});
