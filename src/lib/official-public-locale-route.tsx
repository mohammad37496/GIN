import type { Metadata } from "next";
import { notFound } from "next/navigation";
import OfficialPublicInfo from "@/components/official-public-info";
import { getOfficialInfoCopy } from "@/lib/official-public-info-copy";
import { getOfficialReferenceCopy } from "@/lib/official-public-reference-copy";
import { officialPublicLocales, officialPublicLocaleAlternates, type OfficialPublicLocaleCode } from "@/lib/official-public-locales";
import { officialPublicReferencePages, officialReferencePageAlternates, officialReferencePageKeyForSlug, officialReferencePagePath } from "@/lib/official-public-reference-routes";

type LocalizedLocale = Exclude<OfficialPublicLocaleCode, "en">;

export function generateOfficialPublicLocaleMetadata(locale: LocalizedLocale, slug: string): Metadata {
  const localeData = officialPublicLocales[locale];
  const aboutSlug = localeData.aboutPath.split("/").pop();
  const contactSlug = localeData.contactPath.split("/").pop();
  if (slug === aboutSlug || slug === contactSlug) {
    const page = slug === aboutSlug ? "about" : "contact";
    const pageKey = page === "about" ? "aboutPath" : "contactPath";
    const copy = getOfficialInfoCopy(locale, page);
    if (!copy) return {};
    return {
      title: copy.title,
      description: copy.intro,
      alternates: { canonical: localeData[pageKey], languages: officialPublicLocaleAlternates(pageKey) },
    };
  }

  const referencePageKey = officialReferencePageKeyForSlug(locale, slug);
  if (!referencePageKey) return {};
  const page = officialPublicReferencePages[locale][referencePageKey];
  const copy = getOfficialReferenceCopy(locale, referencePageKey);
  const canonical = officialReferencePagePath(locale, referencePageKey);
  return {
    title: page.label,
    description: copy.intro,
    alternates: { canonical, languages: officialReferencePageAlternates(referencePageKey) },
    openGraph: { type: "website", title: page.label, description: copy.intro, url: canonical, siteName: "Global Information Network" },
  };
}

export function renderOfficialPublicLocalePage(locale: LocalizedLocale, slug: string) {
  const localeData = officialPublicLocales[locale];
  const aboutSlug = localeData.aboutPath.split("/").pop();
  const contactSlug = localeData.contactPath.split("/").pop();
  if (slug === aboutSlug) return <OfficialPublicInfo locale={locale} page="about" />;
  if (slug === contactSlug) return <OfficialPublicInfo locale={locale} page="contact" />;
  const referencePageKey = officialReferencePageKeyForSlug(locale, slug);
  if (referencePageKey) return <OfficialPublicInfo locale={locale} page="reference" referencePageKey={referencePageKey} />;
  notFound();
}
