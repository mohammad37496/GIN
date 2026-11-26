"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { englishPathForPersianPath, hasEnglishCounterpart, persianPathForEnglishPath } from "@/lib/locale-routes";

export default function LocaleSwitcher({ initialLocale = "fa" }: { initialLocale?: "fa" | "en" }) {
  const pathname = usePathname() || "/";
  const [cookieLocale, setCookieLocale] = useState<"fa" | "en" | null>(initialLocale);
  useEffect(() => {
    const locale = document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith("gin_locale="))?.split("=")[1];
    setCookieLocale(locale === "en" || locale === "fa" ? locale : null);
  }, [pathname]);
  const explicitEnglish = pathname === "/en" || pathname.startsWith("/en/");
  const explicitPersian = pathname === "/fa" || pathname.startsWith("/fa/");
  const english = explicitEnglish || (!explicitPersian && cookieLocale === "en" && hasEnglishCounterpart(pathname));
  useEffect(() => {
    const locale = english ? "en" : "fa";
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "fa" ? "rtl" : "ltr";
    document.body.classList.remove("locale-fa", "locale-en");
    document.body.classList.add(`locale-${locale}`);
  }, [english, pathname]);
  const englishHref = explicitEnglish ? pathname : englishPathForPersianPath(pathname);
  const persianHref = explicitEnglish ? persianPathForEnglishPath(pathname) : explicitPersian ? pathname : english ? persianPathForEnglishPath(englishPathForPersianPath(pathname)) : `/fa${pathname === "/" ? "" : pathname}`;
  function remember(locale: "fa" | "en") {
    document.cookie = `gin_locale=${locale}; Path=/; Max-Age=31536000; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`;
  }

  return (
    <details className={`gin-en-language-switcher polylang-item lang-item lang-item-${english ? "en" : "fa"} pll-parent-menu-item ${english ? "current-lang" : ""}`}>
      <summary aria-label={english ? "Choose language" : "انتخاب زبان"}><span className={`gin-en-flag gin-en-flag-${english ? "us" : "ir"}`} aria-hidden="true" />{english ? "English" : "فارسی"}<span aria-hidden="true">⌄</span></summary>
      <div className="gin-en-language-options">
        <Link className="lang-item lang-item-en" href={englishHref} lang="en" aria-current={english ? "page" : undefined} onClick={() => remember("en")}><span className="gin-en-flag gin-en-flag-us" aria-hidden="true" />English</Link>
        <Link className="lang-item lang-item-fa" href={persianHref} lang="fa" aria-current={!english ? "page" : undefined} onClick={() => remember("fa")}><span className="gin-en-flag gin-en-flag-ir" aria-hidden="true" />فارسی</Link>
      </div>
    </details>
  );
}
