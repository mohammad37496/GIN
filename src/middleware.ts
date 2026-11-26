import { NextResponse, type NextRequest } from "next/server";
import { persianToEnglishRoutes } from "@/lib/locale-routes";

function withLocaleCookie(response: NextResponse, locale: "fa" | "en", persist: boolean) {
  if (persist) response.cookies.set("gin_locale", locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  return response;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const explicitEnglish = pathname === "/en" || pathname.startsWith("/en/");
  const explicitPersian = pathname === "/fa" || pathname.startsWith("/fa/");
  const courseMatch = pathname.match(/^\/courses\/([^/]+)(\/lessons\/\d+)?$/);
  const eventMatch = pathname.match(/^\/events\/([^/]+)$/);
  const certificateMatch = pathname.match(/^\/certificates\/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  const hasEnglishRoute = Boolean(persianToEnglishRoutes[pathname] || courseMatch || eventMatch || certificateMatch);
  const inheritedLocale = request.headers.get("x-website-path") ? request.headers.get("x-website-locale") : null;
  const locale = explicitEnglish ? "en" : explicitPersian ? "fa" : inheritedLocale === "en" || inheritedLocale === "fa"
    ? inheritedLocale
    : hasEnglishRoute && request.cookies.get("gin_locale")?.value === "en" ? "en" : "fa";
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-website-locale", locale);
  requestHeaders.set("x-website-path", pathname);

  if (locale === "fa" && (pathname === "/fa" || pathname.startsWith("/fa/"))) {
    const destination = request.nextUrl.clone();
    destination.pathname = pathname === "/fa" || pathname === "/fa/" ? "/" : pathname.slice(3);
    return withLocaleCookie(NextResponse.rewrite(destination, { request: { headers: requestHeaders } }), locale, explicitPersian);
  }

  if (!explicitEnglish && !explicitPersian && locale === "en") {
    const englishPath = persianToEnglishRoutes[pathname];
    if (englishPath) {
      const destination = request.nextUrl.clone();
      destination.pathname = englishPath;
      return withLocaleCookie(NextResponse.rewrite(destination, { request: { headers: requestHeaders } }), locale, explicitEnglish || explicitPersian);
    }
    if (courseMatch) {
      const destination = request.nextUrl.clone();
      destination.pathname = `/en/courses/${courseMatch[1]}${courseMatch[2] ?? ""}`;
      return withLocaleCookie(NextResponse.rewrite(destination, { request: { headers: requestHeaders } }), locale, explicitEnglish || explicitPersian);
    }
    if (eventMatch) {
      const destination = request.nextUrl.clone();
      destination.pathname = `/en/events/${eventMatch[1]}`;
      return withLocaleCookie(NextResponse.rewrite(destination, { request: { headers: requestHeaders } }), locale, explicitEnglish || explicitPersian);
    }
    if (certificateMatch) {
      const destination = request.nextUrl.clone();
      destination.pathname = `/en${pathname}`;
      return withLocaleCookie(NextResponse.rewrite(destination, { request: { headers: requestHeaders } }), locale, explicitEnglish || explicitPersian);
    }
  }

  return withLocaleCookie(NextResponse.next({ request: { headers: requestHeaders } }), locale, explicitEnglish || explicitPersian);
}

export const config = {
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
