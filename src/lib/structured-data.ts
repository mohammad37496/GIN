export const DEFAULT_SITE_URL = "https://globalinformationnetwork.liara.run";
export const ORGANIZATION_NAME = "Global Information Network";

export function getSiteUrl() {
  const configured = process.env.APP_URL?.trim();
  return (configured || DEFAULT_SITE_URL).replace(/\/+$/, "");
}

export function absoluteSiteUrl(path: string) {
  return new URL(path.replace(/^\/+/, ""), `${getSiteUrl()}/`).toString();
}

function usableText(value?: string | null) {
  const normalized = value?.trim();
  if (!normalized || /^translation pending$/i.test(normalized)) return undefined;
  return normalized;
}

export function buildOrganizationSchema() {
  const url = absoluteSiteUrl("/");
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${url}#organization`,
    name: ORGANIZATION_NAME,
    url,
    logo: absoluteSiteUrl("/gin/gin-logo.svg"),
  };
}

export function buildWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: ORGANIZATION_NAME,
    url: absoluteSiteUrl("/"),
    inLanguage: ["en", "fa", "de", "fr", "es", "hu", "sq", "pt"],
    publisher: { "@id": `${absoluteSiteUrl("/")}#organization` },
  };
}

export function buildBreadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.filter((item) => item.name.trim()).map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteSiteUrl(item.path),
    })),
  };
}

export function buildFaqSchema(items: Array<{ question: string; answer: string }>) {
  const mainEntity = items.flatMap((item) => {
    const question = usableText(item.question);
    const answer = usableText(item.answer);
    return question && answer ? [{ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } }] : [];
  });
  if (mainEntity.length === 0) return null;
  return { "@context": "https://schema.org", "@type": "FAQPage", mainEntity };
}

export function buildCourseSchema(input: {
  title: string;
  summary?: string | null;
  path: string;
  language: "fa-IR" | "en-US";
  estimatedMinutes?: number | string | null;
  accessType: string;
}) {
  const title = usableText(input.title);
  if (!title) return null;
  const summary = usableText(input.summary);
  const estimatedMinutes = Number(input.estimatedMinutes);
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: title,
    ...(summary ? { description: summary } : {}),
    url: absoluteSiteUrl(input.path),
    inLanguage: input.language,
    provider: { "@type": "Organization", name: ORGANIZATION_NAME, url: absoluteSiteUrl("/") },
    ...(Number.isFinite(estimatedMinutes) && estimatedMinutes > 0 ? { timeRequired: `PT${estimatedMinutes}M` } : {}),
    isAccessibleForFree: input.accessType === "free",
  };
}

export function buildEventSchema(input: {
  title: string;
  summary?: string | null;
  path: string;
  startsAt: Date | string;
  endsAt?: Date | string | null;
  location?: string | null;
}) {
  const title = usableText(input.title);
  const startDate = new Date(input.startsAt);
  if (!title || !Number.isFinite(startDate.getTime())) return null;
  const endDate = input.endsAt ? new Date(input.endsAt) : null;
  const summary = usableText(input.summary);
  const location = usableText(input.location);
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: title,
    ...(summary ? { description: summary } : {}),
    url: absoluteSiteUrl(input.path),
    startDate: startDate.toISOString(),
    ...(endDate && Number.isFinite(endDate.getTime()) && endDate > startDate ? { endDate: endDate.toISOString() } : {}),
    ...(location ? { location: { "@type": "Place", name: location } } : {}),
    organizer: { "@type": "Organization", name: ORGANIZATION_NAME, url: absoluteSiteUrl("/") },
  };
}

export function serializeJsonLd(value: unknown) {
  return (JSON.stringify(value) ?? "null").replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}
