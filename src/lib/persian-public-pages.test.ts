import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { persianDynamicReferenceSlugs, persianPublicPages } from "./persian-public-pages";
import { publicPages } from "./public-pages";

const slugs = ["our-events", "our-training", "personal-mastery", "become-a-member", "member-benefits-associate", "privacy-policy", "cookie-policy", "terms-of-use", "member-agreement"];

test("all nine Persian public counterparts contain real localized information and an official source", () => {
  for (const slug of slugs) {
    const page = persianPublicPages[slug];
    assert.ok(page, `missing Persian page data: ${slug}`);
    assert.ok(page.title.trim().length > 0, `${slug} has no title`);
    assert.ok(page.intro.trim().length > 50, `${slug} has no useful introduction`);
    assert.ok(page.sections.length >= 2, `${slug} is not a substantive information page`);
    assert.match(page.officialUrl, /^https:\/\//, `${slug} has no official source link`);
    const route = readFileSync(new URL(`../app/${slug}/page.tsx`, import.meta.url), "utf8");
    assert.ok(route.includes(`PersianPublicReferencePage slug="${slug}"`), `${slug} route does not render its Persian information page`);
    assert.ok(!route.includes("redirect("), `${slug} still redirects instead of rendering its counterpart`);
  }
});

test("Persian Our Events reuses exactly the three verified English Bunny embed IDs", () => {
  const english = readFileSync(new URL("../components/english-reference-pages.tsx", import.meta.url), "utf8");
  const page = persianPublicPages["our-events"];
  const component = readFileSync(new URL("../components/persian-public-reference-page.tsx", import.meta.url), "utf8");
  const expected = ["9d916f6f-12a5-4580-a11e-b0681c5f14bb", "3d3338c0-56f8-4db2-b400-e6492cecf320", "79e130ef-1ef9-40b4-b19f-5850aebfeced"];
  assert.deepEqual(page.eventVideoIds, expected);
  for (const id of expected) assert.ok(english.includes(id), `Bunny ID ${id} is not present in the verified English source`);
  assert.match(component, /src=\{`https:\/\/iframe\.mediadelivery\.net\/embed\/34091\/\$\{id\}`\}/);
});

test("Persian membership page distinguishes official GIN application from portal registration", () => {
  const page = persianPublicPages["become-a-member"];
  const component = readFileSync(new URL("../components/persian-public-reference-page.tsx", import.meta.url), "utf8");
  assert.equal(page.officialUrl, "https://signup.globalinformationnetwork.com/");
  assert.match(page.sections[0].body, /درخواست رسمی عضویت/);
  assert.match(page.sections[1].body, /عضویت رسمی/);
  assert.match(page.sections[1].body, /پورتال/);
  assert.match(component, /ورود به سامانه رسمی درخواست عضویت GIN/);
  assert.match(component, /ایجاد حساب جداگانه در پورتال آموزشی/);
});

test("Persian legal summaries retain explicit non-full-text notices and official URLs", () => {
  const legal = ["privacy-policy", "cookie-policy", "terms-of-use", "member-agreement"];
  for (const slug of legal) {
    const page = persianPublicPages[slug];
    assert.ok(page.legalNotice, `${slug} must carry a legal summary notice`);
    assert.match(page.legalNotice, /متن کامل|جایگزین/);
  }
  assert.equal(persianPublicPages["privacy-policy"].officialUrl, "https://globalinformationnetwork.com/privacy-policy-2/");
  assert.equal(persianPublicPages["cookie-policy"].officialUrl, "https://globalinformationnetwork.com/privacy-policy-2/");
  assert.equal(persianPublicPages["terms-of-use"].officialUrl, "https://globalinformationnetwork.com/terms-of-use/");
  assert.equal(persianPublicPages["member-agreement"].officialUrl, "https://globalinformationnetwork.com/member-agreement/");
});

test("Persian Cookie Policy explicitly states that this portal has no consent manager", () => {
  const page = persianPublicPages["cookie-policy"];
  assert.ok(page.sections.some((section) => /بنر رضایت کوکی یا کنترل‌های انتخاب دسته‌بندی کوکی ندارد/.test(section.body)));
  assert.ok(page.sections.some((section) => section.body.includes("gin_locale")));
  assert.ok(page.sections.some((section) => section.body.includes("gin_session")));
});

test("Persian homepage separates official membership application, booking, and portal account registration", () => {
  const home = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.ok(home.includes('href="https://signup.globalinformationnetwork.com/"'));
  assert.ok(home.includes('href="https://calendly.com/d/ct4v-zq9-zqw"'));
  assert.match(home, /ایجاد حساب پورتال/);
  assert.match(home, /این پورتال فرایندی جداگانه/);
});

test("Persian Contact copy describes the actual public contact submission flow", () => {
  const page = publicPages.contact;
  assert.match(page.intro, /فرم تماس این پورتال/);
  assert.match(page.intro, /جایگزین سامانه تماس رسمی GIN نیست/);
  assert.match(page.sections[1].body, /فرم پایین صفحه درخواست را در سامانه آموزشی ثبت می‌کند/);
  assert.doesNotMatch(page.sections[1].body, /در حساب کاربری نگهداری می‌شوند/);
});

test("Persian information page metadata relies on the shared GIN title template only once", () => {
  const route = readFileSync(new URL("../app/[slug]/page.tsx", import.meta.url), "utf8");
  assert.match(route, /title: \/\\bGIN\\b\/i\.test\(page\.title\) \? \{ absolute: page\.title \} : page\.title,/);
  assert.doesNotMatch(route, /title: `\$\{page\.title\} \| GIN`/);
  assert.match(route, /گام بعدی شما/);
  assert.doesNotMatch(route, /YOUR NEXT STEP/);
});

test("Persian public-page eyebrow labels are localized instead of all-caps English navigation text", () => {
  for (const [slug, page] of Object.entries(publicPages)) {
    assert.doesNotMatch(page.eyebrow, /^[A-Z\s&]+$/, `${slug} still has an English-only eyebrow`);
  }
});

test("Persian subtopic pages cover the verified GIN training and membership routes", () => {
  const expected = ["wealth-creation", "financial-independence", "dynamic-health", "happiness", "global-networking", "mentorship", "membership-opportunities"];
  assert.deepEqual([...persianDynamicReferenceSlugs], expected);
  for (const slug of expected) {
    assert.ok(persianPublicPages[slug], `Persian reference page is missing: ${slug}`);
    assert.ok(persianPublicPages[slug].title.length > 3, `${slug} needs a real Persian title`);
    assert.ok(persianPublicPages[slug].sections.length >= 2, `${slug} needs substantive source-based sections`);
    assert.ok(persianPublicPages[slug].officialUrl.startsWith("https://globalinformationnetwork.com/") || persianPublicPages[slug].officialUrl.startsWith("https://signup.globalinformationnetwork.com/"));
  }
});

test("financial and health subtopic pages clearly disclaim professional advice and guaranteed outcomes", () => {
  assert.match(persianPublicPages["wealth-creation"].legalNotice ?? "", /مشاوره مالی|تضمین درآمد/);
  assert.match(persianPublicPages["financial-independence"].legalNotice ?? "", /توصیه مالی/);
  assert.match(persianPublicPages["dynamic-health"].legalNotice ?? "", /توصیه پزشکی/);
  assert.match(persianPublicPages.happiness.legalNotice ?? "", /توصیه درمانی/);
});

test("Persian dynamic reference routes are statically generated, mapped, and discoverable", () => {
  const route = readFileSync(new URL("../app/[slug]/page.tsx", import.meta.url), "utf8");
  const localeRoutes = readFileSync(new URL("./locale-routes.ts", import.meta.url), "utf8");
  const sitemap = readFileSync(new URL("../app/sitemap.ts", import.meta.url), "utf8");
  const footer = readFileSync(new URL("../components/public-footer.tsx", import.meta.url), "utf8");
  assert.match(route, /persianDynamicReferenceSlugs\.map/);
  assert.match(route, /PersianPublicReferencePage slug=\{slug\}/);
  for (const slug of ["wealth-creation", "financial-independence", "dynamic-health", "happiness", "global-networking", "mentorship", "membership-opportunities"]) {
    assert.ok(localeRoutes.includes(`/en/${slug}`) && localeRoutes.includes(`/fa/${slug}`), `${slug} is missing locale mapping`);
    assert.ok(sitemap.includes(`/en/${slug}`) && sitemap.includes(`/fa/${slug}`), `${slug} is missing sitemap alternates`);
    assert.ok(footer.includes(`href="/${slug}"`), `${slug} is missing Persian footer discovery`);
  }
  const successAlias = readFileSync(new URL("../app/success-training/page.tsx", import.meta.url), "utf8");
  const coursesAlias = readFileSync(new URL("../app/training-courses/page.tsx", import.meta.url), "utf8");
  assert.match(successAlias, /redirect\("\/fa\/our-training"\)/);
  assert.match(coursesAlias, /redirect\("\/fa\/our-training"\)/);
});

test("Persian public footer exposes all four legal pages", () => {
  const footer = readFileSync(new URL("../components/public-footer.tsx", import.meta.url), "utf8");
  for (const slug of ["privacy-policy", "cookie-policy", "terms-of-use", "member-agreement"]) {
    assert.ok(footer.includes(`href="/${slug}"`), `footer is missing /${slug}`);
  }
});

test("Persian footer makes the new information pages discoverable without conflating the event calendar", () => {
  const footer = readFileSync(new URL("../components/public-footer.tsx", import.meta.url), "utf8");
  for (const slug of ["our-events", "our-training", "personal-mastery", "become-a-member", "member-benefits-associate"]) {
    assert.ok(footer.includes(`href="/${slug}"`), `footer is missing /${slug}`);
  }
  assert.match(footer, /تقویم رویدادهای GIN/);
  assert.match(footer, /معرفی برنامه رویدادهای GIN/);
});

test("Persian metadata and sitemap provide reciprocal language alternates for all nine pages", () => {
  const component = readFileSync(new URL("../components/persian-public-reference-page.tsx", import.meta.url), "utf8");
  const englishPage = readFileSync(new URL("../app/en/[slug]/page.tsx", import.meta.url), "utf8");
  const sitemap = readFileSync(new URL("../app/sitemap.ts", import.meta.url), "utf8");
  assert.match(component, /const englishSlug = slug === "privacy-policy" \? "privacy-policy-2" : slug/);
  assert.match(component, /languages: \{ fa: `\/fa\/\$\{slug\}`, en: `\/en\/\$\{englishSlug\}` \}/);
  assert.match(englishPage, /const hasPersianCounterpart = faPath !== "\/fa"/);
  for (const slug of slugs) {
    const englishSlug = slug === "privacy-policy" ? "privacy-policy-2" : slug;
    assert.ok(sitemap.includes(`"/en/${englishSlug}", "/fa/${slug}"`), `sitemap is missing reciprocal pair for ${slug}`);
  }
});
