"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { englishPathForPersianPath, hasEnglishCounterpart, persianPathForEnglishPath } from "@/lib/locale-routes";
import { officialGinLanguages } from "@/lib/official-gin-languages";
import { officialLocaleForPath, officialPageKeyForPath } from "@/lib/official-public-locales";
import { officialReferencePageKeyForPath, officialReferencePagePath } from "@/lib/official-public-reference-routes";
import type { OfficialPublicLocaleCode } from "@/lib/official-public-locales";

export default function LocaleSwitcher({ initialLocale = "fa" }: { initialLocale?: "fa" | "en" }) {
  const pathname = usePathname() || "/";
  const [cookieLocale, setCookieLocale] = useState<"fa" | "en" | null>(initialLocale);
  useEffect(() => {
    const locale = document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith("gin_locale="))?.split("=")[1];
    setCookieLocale(locale === "en" || locale === "fa" ? locale : null);
  }, [pathname]);
  const explicitOfficialLocale = officialLocaleForPath(pathname);
  const officialPageKey = officialPageKeyForPath(pathname);
  const referencePageKey = officialReferencePageKeyForPath(pathname);
  const explicitEnglish = pathname === "/en" || pathname.startsWith("/en/");
  const explicitPersian = pathname === "/fa" || pathname.startsWith("/fa/");
  const english = explicitEnglish || (!explicitOfficialLocale && !explicitPersian && cookieLocale === "en" && hasEnglishCounterpart(pathname));
  useEffect(() => {
    const locale = explicitOfficialLocale ?? (english ? "en" : "fa");
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "fa" ? "rtl" : "ltr";
    document.body.classList.remove("locale-fa", "locale-en", "locale-de", "locale-fr", "locale-es", "locale-hu", "locale-sq", "locale-pt");
    document.body.classList.add(`locale-${locale}`);
  }, [english, explicitOfficialLocale, pathname]);
  const englishHref = explicitEnglish ? pathname : explicitOfficialLocale ? "/en" : englishPathForPersianPath(pathname);
  const persianHref = explicitEnglish ? persianPathForEnglishPath(pathname) : explicitOfficialLocale ? "/fa" : explicitPersian ? pathname : english ? persianPathForEnglishPath(englishPathForPersianPath(pathname)) : `/fa${pathname === "/" ? "" : pathname}`;
  const currentLocale = explicitOfficialLocale ?? (english ? "en" : "fa");
  const currentLabel = officialGinLanguages.find((language) => language.code === currentLocale)?.label ?? (english ? "English" : "فارسی");
  function remember(locale: "fa" | "en") {
    document.cookie = `gin_locale=${locale}; Path=/; Max-Age=31536000; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`;
  }

  return (
    <details className={`gin-en-language-switcher polylang-item lang-item lang-item-${currentLocale} pll-parent-menu-item ${english ? "current-lang" : ""}`}>
      <summary aria-label={english ? "Choose language" : "انتخاب زبان"}><span className={`gin-en-flag gin-en-flag-${english ? "us" : "ir"}`} aria-hidden="true" />{currentLabel}<span aria-hidden="true">⌄</span></summary>
      <div className="gin-en-language-options">
        <div className="gin-en-language-group-label">{english ? "Portal language" : "زبان پورتال"}</div>
        <Link className="lang-item lang-item-en" href={englishHref} lang="en" aria-current={english ? "page" : undefined} onClick={() => remember("en")}><span className="gin-en-flag gin-en-flag-us" aria-hidden="true" />English</Link>
        <Link className="lang-item lang-item-fa" href={persianHref} lang="fa" aria-current={!english ? "page" : undefined} onClick={() => remember("fa")}><span className="gin-en-flag gin-en-flag-ir" aria-hidden="true" />فارسی</Link>
        <div className="gin-en-language-group-label">{english ? "GIN website" : "وب‌سایت GIN"}</div>
        {officialGinLanguages.map((language) => (
          <Link key={language.code} href={referencePageKey ? officialReferencePagePath(language.code as OfficialPublicLocaleCode, referencePageKey) : language.paths[officialPageKey]} lang={language.code} aria-current={explicitOfficialLocale === language.code ? "page" : undefined}>
            {language.label}
          </Link>
        ))}
      </div>
    </details>
  );
}
