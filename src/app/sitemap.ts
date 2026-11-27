import type { MetadataRoute } from "next";
import { pool } from "@/lib/db";
import { getSiteUrl } from "@/lib/structured-data";
import { officialPublicLocales, officialPublicLocaleCodes } from "@/lib/official-public-locales";
import { officialPublicReferencePages, officialReferencePageAlternates, officialReferencePageKeyForPath, officialReferencePagePath, type OfficialReferencePageKey } from "@/lib/official-public-reference-routes";

const siteUrl = getSiteUrl();

// Sitemap generation is a read-only runtime concern. Never run migrations or
// bootstrap an administrator from a metadata route (including during builds).
export const dynamic = "force-dynamic";

function translatedAlternates(english: string, persian: string) {
  const languages: Record<string, string> = { en: `${siteUrl}${english}`, fa: `${siteUrl}${persian}`, "x-default": `${siteUrl}${english}` };
  const pageKey = english === "/en" ? "homePath" : english === "/en/about-us" ? "aboutPath" : english === "/en/contact-us" ? "contactPath" : null;
  if (pageKey) {
    for (const locale of Object.values(officialPublicLocales)) languages[locale.htmlLang] = `${siteUrl}${locale[pageKey]}`;
  }
  const referencePageKey = officialReferencePageKeyForPath(english);
  if (referencePageKey) {
    for (const [locale, path] of Object.entries(officialReferencePageAlternates(referencePageKey))) languages[locale] = `${siteUrl}${path}`;
  }
  return languages;
}

const translatedPages: [string, string, number][] = [
  ["/en", "/fa", 1],
  ["/en/about-us", "/fa/about", 0.8],
  ["/en/who-we-are", "/fa/who-we-are", 0.7],
  ["/en/what-we-offer", "/fa/what-we-offer", 0.8],
  ["/en/member-benefits", "/fa/member-benefits", 0.8],
  ["/en/the-gin-success-system", "/fa/success-system", 0.7],
  ["/en/events", "/fa/events", 0.8],
  ["/en/gin-hotels", "/fa/hotels", 0.6],
  ["/en/clubhouses-and-lodges", "/fa/clubhouses", 0.6],
  ["/en/the-gin-cruise-ship", "/fa/cruise", 0.6],
  ["/en/membership-levels", "/fa/membership-levels", 0.8],
  ["/en/faq", "/fa/faq", 0.7],
  ["/en/contact-us", "/fa/contact", 0.7],
  ["/en/our-events", "/fa/our-events", 0.3],
  ["/en/our-training", "/fa/our-training", 0.3],
  ["/en/personal-mastery", "/fa/personal-mastery", 0.3],
  ["/en/become-a-member", "/fa/become-a-member", 0.3],
  ["/en/member-benefits-associate", "/fa/member-benefits-associate", 0.3],
  ["/en/privacy-policy-2", "/fa/privacy-policy", 0.3],
  ["/en/cookie-policy", "/fa/cookie-policy", 0.3],
  ["/en/terms-of-use", "/fa/terms-of-use", 0.3],
  ["/en/member-agreement", "/fa/member-agreement", 0.3],
  ["/en/wealth-creation", "/fa/wealth-creation", 0.3],
  ["/en/financial-independence", "/fa/financial-independence", 0.3],
  ["/en/dynamic-health", "/fa/dynamic-health", 0.3],
  ["/en/happiness", "/fa/happiness", 0.3],
  ["/en/global-networking", "/fa/global-networking", 0.3],
  ["/en/mentorship", "/fa/mentorship", 0.3],
  ["/en/membership-opportunities", "/fa/membership-opportunities", 0.3],
  ["/en/courses", "/fa/courses", 0.8],
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = translatedPages.flatMap(([english, persian, priority]) => [
    { url: `${siteUrl}${english}`, lastModified: now, changeFrequency: "weekly", priority, alternates: { languages: translatedAlternates(english, persian) } },
    { url: `${siteUrl}${persian}`, lastModified: now, changeFrequency: "weekly", priority, alternates: { languages: translatedAlternates(english, persian) } },
  ]);

  const publicLocalePages = ["homePath", "aboutPath", "contactPath"] as const;
  for (const pageKey of publicLocalePages) {
    const persianPath = pageKey === "homePath" ? "/fa" : pageKey === "aboutPath" ? "/fa/about" : "/fa/contact";
    const paths: Record<string, string> = { ...Object.fromEntries(officialPublicLocaleCodes.map((code) => [code, `${siteUrl}${officialPublicLocales[code][pageKey]}`])), fa: `${siteUrl}${persianPath}` };
    for (const code of officialPublicLocaleCodes) {
      if (code === "en") continue;
      const path = officialPublicLocales[code][pageKey];
      entries.push({ url: `${siteUrl}${path}`, lastModified: now, changeFrequency: "weekly", priority: pageKey === "homePath" ? 1 : 0.7, alternates: { languages: { ...paths, "x-default": paths.en } } });
    }
  }

  const referencePageKeys = Object.keys(officialPublicReferencePages.de) as OfficialReferencePageKey[];
  const existingUrls = new Set(entries.map((entry) => entry.url));
  for (const pageKey of referencePageKeys) {
    const languages = Object.fromEntries(Object.entries(officialReferencePageAlternates(pageKey)).map(([locale, path]) => [locale, `${siteUrl}${path}`]));
    for (const code of officialPublicLocaleCodes) {
      const path = officialReferencePagePath(code, pageKey);
      const url = `${siteUrl}${path}`;
      if (existingUrls.has(url)) continue;
      entries.push({ url, lastModified: now, changeFrequency: "monthly", priority: 0.6, alternates: { languages } });
      existingUrls.add(url);
    }
  }

  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN READ ONLY");
      await client.query("SET LOCAL statement_timeout = '5000ms'");
      const [courses, events] = await Promise.all([
        client.query<{ slug: string; published_at: Date | string | null }>("SELECT slug,published_at FROM courses WHERE status='published' ORDER BY published_at DESC NULLS LAST"),
        client.query<{ slug: string; starts_at: Date | string | null }>("SELECT slug,starts_at FROM events WHERE status='published' AND ends_at>NOW() ORDER BY starts_at"),
      ]);
      for (const course of courses.rows) {
        entries.push({ url: `${siteUrl}/en/courses/${course.slug}`, lastModified: course.published_at ? new Date(course.published_at) : now, changeFrequency: "monthly", priority: 0.6, alternates: { languages: { en: `${siteUrl}/en/courses/${course.slug}`, fa: `${siteUrl}/fa/courses/${course.slug}` } } });
        entries.push({ url: `${siteUrl}/fa/courses/${course.slug}`, lastModified: course.published_at ? new Date(course.published_at) : now, changeFrequency: "monthly", priority: 0.6, alternates: { languages: { en: `${siteUrl}/en/courses/${course.slug}`, fa: `${siteUrl}/fa/courses/${course.slug}` } } });
      }
      for (const event of events.rows) {
        entries.push({ url: `${siteUrl}/en/events/${event.slug}`, lastModified: event.starts_at ? new Date(event.starts_at) : now, changeFrequency: "weekly", priority: 0.6, alternates: { languages: { en: `${siteUrl}/en/events/${event.slug}`, fa: `${siteUrl}/fa/events/${event.slug}` } } });
        entries.push({ url: `${siteUrl}/fa/events/${event.slug}`, lastModified: event.starts_at ? new Date(event.starts_at) : now, changeFrequency: "weekly", priority: 0.6, alternates: { languages: { en: `${siteUrl}/en/events/${event.slug}`, fa: `${siteUrl}/fa/events/${event.slug}` } } });
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  } catch {
    // The public route set remains available if the database is unavailable.
  }

  return entries;
}
