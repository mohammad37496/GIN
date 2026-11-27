import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { persianPathForEnglishPath } from "./locale-routes";

const switcher = readFileSync(new URL("../components/locale-switcher.tsx", import.meta.url), "utf8");

test("locale switcher synchronizes document language, direction, and body locale class after client navigation", () => {
  assert.match(switcher, /const locale = explicitOfficialLocale \?\? \(english \? "en" : "fa"\)/);
  assert.match(switcher, /document\.documentElement\.lang = locale/);
  assert.match(switcher, /document\.documentElement\.dir = locale === "fa" \? "rtl" : "ltr"/);
  assert.match(switcher, /document\.body\.classList\.remove\("locale-fa", "locale-en", "locale-de", "locale-fr", "locale-es", "locale-hu", "locale-sq", "locale-pt"\)/);
  assert.match(switcher, /document\.body\.classList\.add\(`locale-\$\{locale\}`\)/);
  assert.match(switcher, /\}, \[english, explicitOfficialLocale, pathname\]\)/);
  assert.match(switcher, /aria-label=\{english \? "Choose language" : "انتخاب زبان"\}/);
});

test("explicit locale routes override the saved cookie and cookie persistence remains intact", () => {
  assert.match(switcher, /const explicitEnglish = pathname === "\/en" \|\| pathname\.startsWith\("\/en\/"\)/);
  assert.match(switcher, /const explicitPersian = pathname === "\/fa" \|\| pathname\.startsWith\("\/fa\/"\)/);
  assert.match(switcher, /const english = explicitEnglish \|\| \(!explicitOfficialLocale && !explicitPersian && cookieLocale === "en" && hasEnglishCounterpart\(pathname\)\)/);
  assert.match(switcher, /document\.cookie = `gin_locale=\$\{locale\}; Path=\/; Max-Age=31536000; SameSite=Lax/);
  assert.match(switcher, /onClick=\{\(\) => remember\("en"\)\}/);
  assert.match(switcher, /onClick=\{\(\) => remember\("fa"\)\}/);
  assert.match(switcher, /href=\{englishHref\}/);
  assert.match(switcher, /href=\{persianHref\}/);
});

test("portal language switching preserves the current English route before applying official-locale fallbacks", () => {
  assert.match(switcher, /const englishHref = explicitEnglish \? pathname : explicitOfficialLocale \? "\/en" : englishPathForPersianPath\(pathname\)/);
  assert.match(switcher, /const persianHref = explicitEnglish \? persianPathForEnglishPath\(pathname\) : explicitOfficialLocale \? "\/fa" : explicitPersian \? pathname/);
  assert.equal(persianPathForEnglishPath("/en/dashboard"), "/fa/dashboard");
  assert.equal(persianPathForEnglishPath("/en/the-gin-success-system"), "/fa/success-system");
  assert.equal(persianPathForEnglishPath("/en/contact-us"), "/fa/contact");
});
