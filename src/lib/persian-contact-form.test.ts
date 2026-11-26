import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { contactCountryOptions } from "./contact-countries";

const component = readFileSync(new URL("../components/persian-contact-form.tsx", import.meta.url), "utf8");
const publicPage = readFileSync(new URL("../app/[slug]/page.tsx", import.meta.url), "utf8");
const supportPage = readFileSync(new URL("../app/support/page.tsx", import.meta.url), "utf8");
const supportForm = readFileSync(new URL("../components/support-form.tsx", import.meta.url), "utf8");

test("Persian contact page uses the unauthenticated contact-submission endpoint, not the support inbox", () => {
  assert.match(publicPage, /import PersianContactForm from "@\/components\/persian-contact-form"/);
  assert.match(publicPage, /slug === "contact" && <PersianContactForm\/>/);
  assert.doesNotMatch(publicPage, /SupportForm/);
  assert.match(component, /fetch\("\/api\/contact"/);
  assert.match(component, /فرم تماس پورتال آموزشی GIN/);
  assert.match(component, /جایگزین سامانه تماس رسمی GIN نیست/);
  assert.match(component, /درخواست شما با موفقیت در پورتال آموزشی ثبت شد/);
});

test("Persian contact form preserves all 250 country values and the 35 backend language values", () => {
  assert.equal(contactCountryOptions.length, 250);
  const languageRows = component.match(/\["[A-Za-z]+", "[^"]+"\]/g) ?? [];
  assert.equal(languageRows.length, 35);
  assert.match(component, /preferredLanguage: "English"/);
  assert.match(component, /contactCountryOptions\.map/);
  assert.match(component, /isContactCountryCode\(mapped\.countryCode\)/);
});

test("Persian contact form preserves conditional messaging fields, consent, honeypot and Google Places mapping", () => {
  assert.match(component, /mapGooglePlaceToAddress/);
  assert.match(component, /item_6__fluent_sf/);
  assert.match(component, /includes\("Telegram"\)/);
  assert.match(component, /includes\("WhatsApp"\)/);
  assert.match(component, /name="smsConsent"/);
  assert.match(component, /name="legalConsent"[\s\S]*required/);
  assert.match(component, /role="alert" aria-live="assertive"/);
  assert.match(component, /role="status" aria-live="polite"/);
  assert.match(component, /onInvalidCapture/);
  assert.match(component, /setCustomValidity\("تکمیل این فیلد الزامی است\."\)/);
  assert.match(component, /نشانی‌های ایمیل یکسان نیستند/);
  assert.match(component, /if \(!response\.ok\)/);
});

test("Persian Support remains a separate authenticated request and inbox flow", () => {
  assert.match(supportPage, /SupportForm authenticated=\{Boolean\(user\)\}/);
  assert.match(supportPage, /user&&<SupportInbox\/>/);
  assert.match(supportPage, /h1 className="page-title"/);
  assert.match(supportPage, /canonical:"\/fa\/support"/);
  assert.match(supportPage, /robots:\{index:false,follow:false\}/);
  assert.match(supportForm, /\/login\?next=%2Fsupport/);
  assert.match(supportForm, /\/api\/support\/messages/);
});
