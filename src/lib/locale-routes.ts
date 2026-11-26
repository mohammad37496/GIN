export const englishToPersianRoutes: Record<string, string> = {
  "/en": "/fa",
  "/en/about-us": "/fa/about",
  "/en/who-we-are": "/fa/who-we-are",
  "/en/what-we-offer": "/fa/what-we-offer",
  "/en/member-benefits": "/fa/member-benefits",
  "/en/the-gin-success-system": "/fa/success-system",
  "/en/events": "/fa/events",
  "/en/gin-hotels": "/fa/hotels",
  "/en/clubhouses-and-lodges": "/fa/clubhouses",
  "/en/the-gin-cruise-ship": "/fa/cruise",
  "/en/membership-levels": "/fa/membership-levels",
  "/en/portal-membership": "/fa/membership",
  "/en/faq": "/fa/faq",
  "/en/contact-us": "/fa/contact",
  "/en/register": "/fa/register",
  "/en/login": "/fa/login",
  "/en/courses": "/fa/courses",
  "/en/support": "/fa/support",
  "/en/dashboard": "/fa/dashboard",
  "/en/profile": "/fa/profile",
  "/en/admin": "/fa/admin",
  "/en/instructor": "/fa/instructor",
  "/en/events-manager": "/fa/events-manager",
  "/en/finance-center": "/fa/finance-center",
  "/en/support-center": "/fa/support-center",
  "/en/affiliate": "/fa/affiliate",
  "/en/privacy-policy": "/fa",
  "/en/terms-of-use": "/fa",
  "/en/member-agreement": "/fa",
};

export const persianToEnglishRoutes: Record<string, string> = {
  "/": "/en",
  "/about": "/en/about-us",
  "/who-we-are": "/en/who-we-are",
  "/why-join": "/en/what-we-offer",
  "/what-we-offer": "/en/what-we-offer",
  "/member-benefits": "/en/member-benefits",
  "/success-system": "/en/the-gin-success-system",
  "/events": "/en/events",
  "/hotels": "/en/gin-hotels",
  "/clubhouses": "/en/clubhouses-and-lodges",
  "/cruise": "/en/the-gin-cruise-ship",
  "/faq": "/en/faq",
  "/contact": "/en/contact-us",
  "/register": "/en/register",
  "/login": "/en/login",
  "/courses": "/en/courses",
  "/support": "/en/support",
  "/dashboard": "/en/dashboard",
  "/profile": "/en/profile",
  "/admin": "/en/admin",
  "/instructor": "/en/instructor",
  "/events-manager": "/en/events-manager",
  "/finance-center": "/en/finance-center",
  "/support-center": "/en/support-center",
  "/affiliate": "/en/affiliate",
  "/membership": "/en/portal-membership",
  "/membership-levels": "/en/membership-levels",
};

export function persianPathForEnglishPath(pathname: string): string {
  const courseMatch = pathname.match(/^\/en\/courses\/([^/]+)(\/lessons\/\d+)?$/);
  if (courseMatch) return `/fa/courses/${courseMatch[1]}${courseMatch[2] ?? ""}`;
  const eventMatch = pathname.match(/^\/en\/events\/([^/]+)$/);
  if (eventMatch) return `/fa/events/${eventMatch[1]}`;
  const certificateMatch = pathname.match(/^\/en\/certificates\/([0-9a-f-]{36})$/i);
  if (certificateMatch) return `/fa/certificates/${certificateMatch[1]}`;
  return englishToPersianRoutes[pathname] ?? "/fa";
}

export function englishPathForPersianPath(pathname: string): string {
  const normalized = pathname.replace(/^\/fa(?=\/|$)/, "") || "/";
  const courseMatch = normalized.match(/^\/courses\/([^/]+)(\/lessons\/\d+)?$/);
  if (courseMatch) return `/en/courses/${courseMatch[1]}${courseMatch[2] ?? ""}`;
  const eventMatch = normalized.match(/^\/events\/([^/]+)$/);
  if (eventMatch) return `/en/events/${eventMatch[1]}`;
  const certificateMatch = normalized.match(/^\/certificates\/([0-9a-f-]{36})$/i);
  if (certificateMatch) return `/en/certificates/${certificateMatch[1]}`;
  return persianToEnglishRoutes[normalized] ?? "/en";
}

export function hasEnglishCounterpart(pathname: string): boolean {
  const normalized = pathname.replace(/^\/fa(?=\/|$)/, "") || "/";
  return normalized === "/" || Boolean(persianToEnglishRoutes[normalized]) ||
    /^\/courses\/[^/]+(?:\/lessons\/\d+)?$/.test(normalized) ||
    /^\/events\/[^/]+$/.test(normalized) ||
    /^\/certificates\/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(normalized);
}
