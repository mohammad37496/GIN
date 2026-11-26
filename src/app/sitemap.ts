import type { MetadataRoute } from "next";
import { ensureSchema, pool } from "@/lib/db";

const siteUrl = process.env.APP_URL?.trim() || "https://globalinformationnetwork.liara.run";

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
  ["/en/courses", "/fa/courses", 0.8],
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = translatedPages.flatMap(([english, persian, priority]) => [
    { url: `${siteUrl}${english}`, lastModified: now, changeFrequency: "weekly", priority, alternates: { languages: { en: `${siteUrl}${english}`, fa: `${siteUrl}${persian}` } } },
    { url: `${siteUrl}${persian}`, lastModified: now, changeFrequency: "weekly", priority, alternates: { languages: { en: `${siteUrl}${english}`, fa: `${siteUrl}${persian}` } } },
  ]);

  entries.push(...[
    "/en/our-events", "/en/our-training", "/en/personal-mastery", "/en/become-a-member", "/en/member-benefits-associate", "/en/privacy-policy", "/en/terms-of-use", "/en/member-agreement",
  ].map((path) => ({ url: `${siteUrl}${path}`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.3 })));

  try {
    await ensureSchema();
    const [courses, events] = await Promise.all([
      pool.query("SELECT slug,published_at FROM courses WHERE status='published' ORDER BY published_at DESC NULLS LAST"),
      pool.query("SELECT slug,starts_at FROM events WHERE status='published' AND ends_at>NOW() ORDER BY starts_at"),
    ]);
    for (const course of courses.rows) {
      entries.push({ url: `${siteUrl}/en/courses/${course.slug}`, lastModified: course.published_at ? new Date(course.published_at) : now, changeFrequency: "monthly", priority: 0.6, alternates: { languages: { en: `${siteUrl}/en/courses/${course.slug}`, fa: `${siteUrl}/fa/courses/${course.slug}` } } });
      entries.push({ url: `${siteUrl}/fa/courses/${course.slug}`, lastModified: course.published_at ? new Date(course.published_at) : now, changeFrequency: "monthly", priority: 0.6, alternates: { languages: { en: `${siteUrl}/en/courses/${course.slug}`, fa: `${siteUrl}/fa/courses/${course.slug}` } } });
    }
    for (const event of events.rows) {
      entries.push({ url: `${siteUrl}/en/events/${event.slug}`, lastModified: event.starts_at ? new Date(event.starts_at) : now, changeFrequency: "weekly", priority: 0.6, alternates: { languages: { en: `${siteUrl}/en/events/${event.slug}`, fa: `${siteUrl}/fa/events/${event.slug}` } } });
      entries.push({ url: `${siteUrl}/fa/events/${event.slug}`, lastModified: event.starts_at ? new Date(event.starts_at) : now, changeFrequency: "weekly", priority: 0.6, alternates: { languages: { en: `${siteUrl}/en/events/${event.slug}`, fa: `${siteUrl}/fa/events/${event.slug}` } } });
    }
  } catch {
    // The static public routes remain in the sitemap when the portal database is offline.
  }

  return entries;
}
