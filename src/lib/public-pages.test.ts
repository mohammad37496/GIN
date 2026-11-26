import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { ginMembershipLevels } from "./gin-membership-levels";
import { publicPages } from "./public-pages";

const text = (slug: keyof typeof publicPages) => {
  const page = publicPages[slug];
  return [page.intro, ...page.sections.flatMap((section) => [section.title, section.body])].join("\n");
};

test("Persian What We Offer names the reference courses and keeps portal availability factual", () => {
  const content = text("what-we-offer");
  assert.match(content, /Success Mastery Course/);
  assert.match(content, /Science of Personal Mastery/);
  assert.match(content, /چهار رویداد Major Weekend در سال/);
  assert.match(content, /چهار سمینار و گردهمایی/);
  assert.match(content, /کنفرانس‌ها، کارگاه‌ها/);
  assert.match(content, /این پورتال فقط دوره‌ها و رویدادهایی را ارائه می‌کند/);
  assert.match(content, /جایگزین مشاوره مالی/);
  assert.match(content, /توصیه پزشکی یا درمان تأییدشده تلقی نمی‌کند/);
});

test("Persian member benefits separates official reference benefits from portal entitlements", () => {
  const content = text("member-benefits");
  assert.match(content, /Success Mastery Course/);
  assert.match(content, /۱٬۵۰۰ دلار/);
  assert.match(content, /۱۵۰ دلار/);
  assert.match(content, /بلیت رایگان/);
  assert.match(content, /۲۰٬۰۰۰ دلار/);
  assert.match(content, /ادعای منتشرشده خود سازمان است/);
  assert.match(content, /این صفحه و پورتال، دسترسی یا ارائه خودکار آن مزایا را تضمین نمی‌کنند/);
});

test("Persian success system retains course, learning, and assessment guidance", () => {
  const content = text("success-system");
  assert.match(content, /پنج عنصر اصلی/);
  for (const pillar of ["آموزش صوتی", "کتاب‌ها", "رویدادها", "قدردانی و به‌رسمیت‌شناختن", "روابط"]) {
    assert.ok(content.includes(pillar), `success-system is missing the ${pillar} pillar`);
  }
  assert.match(content, /نتیجه مالی یا شخصی مشخصی را تضمین نمی‌کنند/);
});

test("Persian FAQ attributes membership claims and preserves approval, cancellation, and payment caveats", () => {
  const content = text("faq");
  assert.match(content, /۱٬۵۰۰ دلار/);
  assert.match(content, /۱۵۰ دلار/);
  assert.match(content, /۱ ژانویه ۲۰۲۷/);
  assert.match(content, /مبلغ نهایی باید پیش از پرداخت توسط مدیریت تأیید شود/);
  assert.match(content, /پذیرش همه متقاضیان تضمین نمی‌شود/);
  assert.match(content, /هر درخواست به بررسی و تأیید سازمان وابسته است/);
  assert.match(content, /اعضا می‌توانند در هر زمان عضویت را لغو کنند/);
  assert.match(content, /ثبت‌نام در این پورتال فقط حساب آموزشی ایجاد می‌کند/);
});

test("portal membership stays private and separate from the public 12-level reference page", () => {
  const portal = readFileSync(new URL("../app/membership/page.tsx", import.meta.url), "utf8");
  const reference = readFileSync(new URL("../app/membership-levels/page.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(portal, /canonical: "\/fa\/membership"/);
  assert.match(portal, /robots: \{ index: false, follow: false \}/);
  assert.match(portal, /FROM membership_plans/);
  assert.match(portal, /درگاه پرداخت هنوز فعال نشده است/);
  assert.doesNotMatch(portal, /referenceLevels|membership-reference/);

  assert.match(reference, /canonical: "\/fa\/membership-levels"/);
  assert.match(reference, /ginMembershipLevels\.map/);
  assert.deepEqual(ginMembershipLevels.map((item) => item.level), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  assert.match(css, /\.membership-levels-reference-page/);
  assert.match(css, /\.membership-levels-reference-table/);
});
