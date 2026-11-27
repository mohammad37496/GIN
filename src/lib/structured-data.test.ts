import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { buildBreadcrumbSchema, buildCourseSchema, buildEventSchema, buildFaqSchema, buildOrganizationSchema, buildWebsiteSchema, getSiteUrl, serializeJsonLd } from "./structured-data";
import { buildLessonMetadata, hasUsableLessonTranslation } from "./lesson-metadata";

test("organization and website schemas use the configured site identity and real logo asset", () => {
  const previous = process.env.APP_URL;
  process.env.APP_URL = "https://gin.example.test/";
  try {
    const organization = buildOrganizationSchema();
    const website = buildWebsiteSchema();
    assert.equal(getSiteUrl(), "https://gin.example.test");
    assert.equal(organization.name, "Global Information Network");
    assert.equal(organization.url, "https://gin.example.test/");
    assert.equal(organization.logo, "https://gin.example.test/gin/gin-logo.svg");
    assert.equal(organization["@id"], "https://gin.example.test/#organization");
    assert.equal(website.url, organization.url);
    assert.deepEqual(website.inLanguage, ["en", "fa", "de", "fr", "es", "hu", "sq", "pt"]);
    assert.equal(website.publisher["@id"], "https://gin.example.test/#organization");
  } finally {
    if (previous === undefined) delete process.env.APP_URL;
    else process.env.APP_URL = previous;
  }
});

test("lesson metadata pairs locale URLs and indexes only public, translated previews", () => {
  const persianPreview = buildLessonMetadata({ locale: "fa", slug: "course-one", lessonId: 7, title: "درس نمونه", summary: "خلاصه درس", isPreview: true, hasTranslation: true, hasCounterpartTranslation: true });
  assert.equal(persianPreview.alternates?.canonical, "/fa/courses/course-one/lessons/7");
  assert.equal(persianPreview.robots && typeof persianPreview.robots !== "string" && persianPreview.robots.index, true);
  assert.equal(persianPreview.alternates?.languages?.fa, "/fa/courses/course-one/lessons/7");
  assert.equal(persianPreview.alternates?.languages?.en, "/en/courses/course-one/lessons/7");

  const englishPreview = buildLessonMetadata({ locale: "en", slug: "course-one", lessonId: 7, title: "Lesson One", isPreview: true, hasTranslation: true, hasCounterpartTranslation: true });
  assert.equal(englishPreview.alternates?.canonical, "/en/courses/course-one/lessons/7");
  assert.equal(englishPreview.alternates?.languages?.fa, "/fa/courses/course-one/lessons/7");
  assert.equal(englishPreview.alternates?.languages?.en, "/en/courses/course-one/lessons/7");

  const missingEnglishCounterpart = buildLessonMetadata({ locale: "fa", slug: "course-one", lessonId: 7, title: "درس نمونه", isPreview: true, hasTranslation: true, hasCounterpartTranslation: false });
  assert.equal(missingEnglishCounterpart.robots && typeof missingEnglishCounterpart.robots !== "string" && missingEnglishCounterpart.robots.index, true);
  assert.equal(missingEnglishCounterpart.alternates?.canonical, "/fa/courses/course-one/lessons/7");
  assert.equal(missingEnglishCounterpart.alternates?.languages, undefined);

  const missingPersianCounterpart = buildLessonMetadata({ locale: "en", slug: "course-one", lessonId: 7, title: "Lesson One", isPreview: true, hasTranslation: true, hasCounterpartTranslation: false });
  assert.equal(missingPersianCounterpart.robots && typeof missingPersianCounterpart.robots !== "string" && missingPersianCounterpart.robots.index, true);
  assert.equal(missingPersianCounterpart.alternates?.canonical, "/en/courses/course-one/lessons/7");
  assert.equal(missingPersianCounterpart.alternates?.languages, undefined);

  const gatedEnglish = buildLessonMetadata({ locale: "en", slug: "course-one", lessonId: 7, title: "Lesson One", isPreview: false, hasTranslation: true, hasCounterpartTranslation: true });
  assert.equal(gatedEnglish.robots && typeof gatedEnglish.robots !== "string" && gatedEnglish.robots.index, false);
  assert.equal(gatedEnglish.alternates?.canonical, "/en/courses/course-one/lessons/7");
  assert.equal(gatedEnglish.alternates?.languages, undefined);
  const untranslatedPreview = buildLessonMetadata({ locale: "en", slug: "course-one", lessonId: 7, title: "Translation pending", isPreview: true, hasTranslation: false });
  assert.equal(untranslatedPreview.title, "Lesson | GIN Learning Library");
  assert.equal(untranslatedPreview.robots && typeof untranslatedPreview.robots !== "string" && untranslatedPreview.robots.index, false);
  assert.equal(untranslatedPreview.alternates?.languages, undefined);
  const invalidLesson = buildLessonMetadata({ locale: "fa", slug: "course-one", lessonId: 0, title: null, isPreview: false });
  assert.equal(invalidLesson.alternates, undefined);
});

test("lesson counterpart readiness requires both a real title and non-empty content", () => {
  assert.equal(hasUsableLessonTranslation("English lesson", "Lesson content"), true);
  assert.equal(hasUsableLessonTranslation("  ", "Lesson content"), false);
  assert.equal(hasUsableLessonTranslation("Translation pending", "Lesson content"), false);
  assert.equal(hasUsableLessonTranslation("English lesson", "  "), false);
});

test("both lesson metadata routes load the counterpart translation without weakening publication filters", () => {
  const persian = readFileSync(new URL("../app/courses/[slug]/lessons/[lessonId]/page.tsx", import.meta.url), "utf8");
  const english = readFileSync(new URL("../app/en/courses/[slug]/lessons/[lessonId]/page.tsx", import.meta.url), "utf8");
  assert.match(persian, /SELECT l\.title,l\.summary,l\.content,l\.title_en,l\.content_en,l\.is_preview/);
  assert.match(english, /SELECT l\.title_en,l\.summary_en,l\.content_en,l\.title,l\.content,l\.is_preview/);
  for (const route of [persian, english]) {
    assert.match(route, /l\.status='published' AND c\.status='published'/);
    assert.match(route, /hasCounterpartTranslation: hasUsableLessonTranslation\(/);
  }
});

test("sitemap and robots use the same normalized site origin as structured data", () => {
  const sitemap = readFileSync(new URL("../app/sitemap.ts", import.meta.url), "utf8");
  const robots = readFileSync(new URL("../app/robots.ts", import.meta.url), "utf8");
  assert.match(sitemap, /import \{ getSiteUrl \} from "@\/lib\/structured-data"/);
  assert.match(robots, /import \{ getSiteUrl \} from "@\/lib\/structured-data"/);
  assert.doesNotMatch(sitemap, /process\.env\.APP_URL/);
  assert.doesNotMatch(robots, /process\.env\.APP_URL/);
  assert.match(sitemap, /export const dynamic = "force-dynamic"/);
  assert.match(sitemap, /BEGIN READ ONLY/);
  assert.doesNotMatch(sitemap, /ensureSchema|runMigrations|bootstrapAdmin/);
});

test("site schemas fall back to the configured production origin", () => {
  const previous = process.env.APP_URL;
  delete process.env.APP_URL;
  try {
    assert.equal(buildWebsiteSchema().url, "https://globalinformationnetworkliara.vercel.app/");
  } finally {
    if (previous !== undefined) process.env.APP_URL = previous;
  }
});

test("root metadata shares the configured SEO origin instead of a separate retired host", () => {
  const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.match(layout, /import \{ getSiteUrl \} from "@\/lib\/structured-data"/);
  assert.match(layout, /metadataBase:\s*new URL\(getSiteUrl\(\)\)/);
  assert.doesNotMatch(layout, /globalinformationnetwork\.liara\.run/);
});

test("breadcrumb schema uses absolute ordered route URLs", () => {
  const schema = buildBreadcrumbSchema([{ name: "Home", path: "/en" }, { name: "Courses", path: "/en/courses" }]);
  assert.equal(schema.itemListElement.length, 2);
  assert.equal(schema.itemListElement[1].position, 2);
  assert.equal(schema.itemListElement[1].item, "https://globalinformationnetworkliara.vercel.app/en/courses");
});

test("FAQ schema includes only visible question and answer pairs", () => {
  const schema = buildFaqSchema([{ question: "Question one", answer: "Answer one" }, { question: "Translation pending", answer: "Not yet translated" }, { question: "Question two", answer: "Answer two" }]);
  assert.equal(schema?.["@type"], "FAQPage");
  assert.equal(schema?.mainEntity.length, 2);
  assert.equal(schema?.mainEntity[0].acceptedAnswer.text, "Answer one");
  assert.equal(buildFaqSchema([]), null);
});

test("course schema includes only published course facts and does not invent price or rating", () => {
  const schema = buildCourseSchema({ title: "Course title", summary: "Course summary", path: "/en/courses/example", language: "en-US", estimatedMinutes: 45, accessType: "members" });
  assert.equal(schema?.["@type"], "Course");
  assert.equal(schema?.name, "Course title");
  assert.equal(schema?.url, "https://globalinformationnetworkliara.vercel.app/en/courses/example");
  assert.equal(schema?.timeRequired, "PT45M");
  assert.equal(schema?.isAccessibleForFree, false);
  assert.equal("offers" in (schema ?? {}), false);
  assert.equal("aggregateRating" in (schema ?? {}), false);
  assert.equal(buildCourseSchema({ title: "Translation pending", path: "/en/courses/untranslated", language: "en-US", accessType: "members" }), null);
});

test("event schema includes actual dates and optional location only when supplied", () => {
  const schema = buildEventSchema({ title: "Event title", path: "/events/example", startsAt: "2026-12-01T10:00:00.000Z", endsAt: "2026-12-01T11:00:00.000Z", location: "  London  " });
  assert.equal(schema?.["@type"], "Event");
  assert.equal(schema?.startDate, "2026-12-01T10:00:00.000Z");
  assert.deepEqual(schema?.location, { "@type": "Place", name: "London" });
  assert.equal("offers" in (schema ?? {}), false);
  const withoutLocation = buildEventSchema({ title: "Online event", path: "/events/online", startsAt: "2026-12-01T10:00:00.000Z" });
  assert.equal("location" in (withoutLocation ?? {}), false);
  assert.equal(buildEventSchema({ title: "Translation pending", path: "/en/events/untranslated", startsAt: "2026-12-01T10:00:00.000Z" }), null);
});

test("JSON-LD serialization escapes script-closing markup and JavaScript separators", () => {
  const serialized = serializeJsonLd({ description: "</script><script>alert(1)</script>\u2028\u2029" });
  assert.ok(!serialized.includes("</script>"));
  assert.ok(serialized.includes("\\u003c/script>"));
  assert.ok(serialized.includes("\\u2028\\u2029"));
  assert.deepEqual(JSON.parse(serialized), { description: "</script><script>alert(1)</script>\u2028\u2029" });
});
