import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { ginMembershipLevels } from "./gin-membership-levels";
import { publicPages } from "./public-pages";

test("GIN membership levels preserve all 12 source rows, titles and pin images", async () => {
  assert.equal(ginMembershipLevels.length, 12);
  assert.deepEqual(ginMembershipLevels.map((item) => item.level), Array.from({ length: 12 }, (_, index) => index + 1));
  assert.equal(ginMembershipLevels[0].qualifications, "Initiation Fee $1,500; Monthly Dues $150");
  assert.equal(ginMembershipLevels[5].title, "Level 6 / Executive Member");
  assert.equal(ginMembershipLevels[11].title, "Level 12 / Partner");
  assert.deepEqual(ginMembershipLevels.map((item) => item.titleFa), [
    "عضو سطح اول", "عضو سطح دوم", "عضو سطح سوم", "عضو سطح چهارم", "عضو سطح پنجم",
    "عضو اجرایی", "افسر ارشد", "مدیر", "باشگاه رؤسا", "باشگاه رئیس هیئت‌مدیره", "حلقه درونی", "شریک",
  ]);
  assert.ok(ginMembershipLevels.slice(1).every((item) => item.qualifications === "CLASSIFIED" && item.benefits === "CLASSIFIED" && item.cashBonuses === "CLASSIFIED"));
  await Promise.all(ginMembershipLevels.map((item) => access(new URL(`../../public/gin/membership-levels/${item.image}`, import.meta.url))));
});

test("Persian membership reference localizes every official level without inventing classified details", async () => {
  assert.deepEqual(ginMembershipLevels.map((item) => item.titleFa), [
    "عضو سطح اول", "عضو سطح دوم", "عضو سطح سوم", "عضو سطح چهارم", "عضو سطح پنجم",
    "عضو اجرایی", "افسر ارشد", "مدیر", "باشگاه رؤسا", "باشگاه رئیس هیئت‌مدیره", "حلقه درونی", "شریک",
  ]);
  assert.ok(ginMembershipLevels.slice(1).every((item) => item.qualifications === "CLASSIFIED" && item.benefits === "CLASSIFIED"));
  const page = await readFile(new URL("../app/membership-levels/page.tsx", import.meta.url), "utf8");
  assert.match(page, /<span>\{item\.titleFa\}<\/span>/);
});

test("Persian public membership and training facts match the published GIN reference", () => {
  assert.match(publicPages["what-we-offer"].sections[0].body, /Success Mastery Course/);
  assert.match(publicPages["what-we-offer"].sections[0].body, /Science of Personal Mastery/);
  assert.ok(publicPages["member-benefits"].sections.some((section) => /Success Mastery Course/.test(section.body)));
  assert.ok(publicPages.faq.sections.some((section) => /۱٬۵۰۰ دلار/.test(section.body) && /۱۵۰ دلار/.test(section.body)));
  assert.ok(publicPages.faq.sections.some((section) => /پذیرش همه متقاضیان/.test(section.body)));
  assert.ok(publicPages["who-we-are"].sections.some((section) => /مستقلاً تأیید نشده‌اند/.test(section.body)));
  assert.ok(publicPages.about.sections.some((section) => /۱۵۰ کشور/.test(section.body)));
  assert.ok(publicPages["why-join"].sections.some((section) => /Roundtable/.test(section.body)));
  assert.ok(publicPages["what-we-offer"].sections.some((section) => /جایگزین مشاوره مالی/.test(section.body)));
  assert.ok(publicPages["what-we-offer"].sections.some((section) => /توصیه پزشکی/.test(section.body)));
});
