import Image from "next/image";
import Link from "next/link";
import { officialLocalePathForPage, officialMemberHomePaths, officialPublicLocaleCodes, officialPublicLocales, type OfficialPublicLocaleCode } from "@/lib/official-public-locales";
import { getOfficialInfoCopy } from "@/lib/official-public-info-copy";
import { getOfficialReferenceCopy } from "@/lib/official-public-reference-copy";
import { OfficialLocaleNavigation, OfficialLocalePicker, OfficialLocaleReferenceNavigation } from "@/components/official-public-home";
import { officialPublicReferencePages, officialReferencePagePath, type OfficialReferencePageKey } from "@/lib/official-public-reference-routes";

export default function OfficialPublicInfo({ locale, page, referencePageKey }: { locale: Exclude<OfficialPublicLocaleCode, "en">; page: "about" | "contact" | "reference"; referencePageKey?: OfficialReferencePageKey }) {
  const localeData = officialPublicLocales[locale];
  const infoCopy = page === "reference" ? null : getOfficialInfoCopy(locale, page);
  const referencePage = page === "reference" && referencePageKey ? officialPublicReferencePages[locale][referencePageKey] : null;
  const referenceCopy = page === "reference" && referencePageKey ? getOfficialReferenceCopy(locale, referencePageKey) : null;
  const title = referencePage?.label ?? infoCopy?.title;
  const intro = referenceCopy?.intro ?? infoCopy?.intro;
  const sourceNote = referenceCopy?.sourceNote ?? infoCopy?.sourceNote;
  const sourceUrl = referencePage?.sourceUrl ?? infoCopy?.sourceUrl;
  const sourceAction = referenceCopy?.action ?? (infoCopy && "action" in infoCopy ? infoCopy.action : locale === "de" ? "Vollständige offizielle Seite" : locale === "fr" ? "Page officielle complète" : locale === "es" ? "Página oficial completa" : locale === "hu" ? "Teljes hivatalos oldal" : locale === "sq" ? "Faqja e plotë zyrtare" : "Página oficial completa");
  const pageKey = page === "about" ? "aboutPath" : page === "contact" ? "contactPath" : "homePath";
  if (!title || !intro || !sourceNote || !sourceUrl || (page === "reference" && !referencePageKey)) return null;
  return (
    <div className="gin-official-locale-site" lang={localeData.htmlLang} dir="ltr">
      <header className="gin-official-locale-header">
        <Link href={localeData.homePath} className="gin-official-locale-brand" aria-label="Global Information Network home"><Image src="/gin/reference-header-banner.jpg" alt="Global Information Network" fill priority sizes="100vw" /></Link>
        <details className="gin-official-locale-mobile-menu"><summary aria-label={localeData.navigation.menu}><span className="gin-official-locale-menu-icon"><i/><i/><i/></span><span>{localeData.navigation.menu}</span></summary><div className="gin-official-locale-mobile-menu-panel"><OfficialLocalePicker locale={locale} pageKey={pageKey} referencePageKey={referencePageKey}/><OfficialLocaleNavigation locale={locale}/><OfficialLocaleReferenceNavigation locale={locale}/></div></details>
        <div className="gin-official-locale-navigation"><OfficialLocalePicker locale={locale} pageKey={pageKey} referencePageKey={referencePageKey}/><OfficialLocaleNavigation locale={locale}/></div>
      </header>
      <div className="gin-official-locale-layout">
      <aside className="gin-official-locale-sidebar"><OfficialLocaleReferenceNavigation locale={locale}/></aside>
      <main className="gin-official-locale-main gin-official-locale-info">
        <nav className="gin-official-locale-breadcrumb"><Link href={localeData.homePath}>{localeData.navigation.home}</Link><span aria-hidden="true">/</span><span>{title}</span></nav>
        <h1>{title}</h1><p className="gin-official-locale-info-intro">{intro}</p>
        {page === "about" && infoCopy && "sections" in infoCopy ? <div className="gin-official-locale-info-sections">{infoCopy.sections.map((section) => <section key={section.title}><h2>{section.title}</h2><p>{section.body}</p></section>)}</div> : null}
        {referenceCopy?.sections.length ? <div className="gin-official-locale-info-sections">{referenceCopy.sections.map((section) => <section key={section.title}><h2>{section.title}</h2><p>{section.body}</p></section>)}</div> : null}
        {referenceCopy ? <p className="gin-official-locale-reference-notice">{referenceCopy.legalNotice}</p> : null}
        <aside className="gin-official-locale-source-note"><p>{sourceNote}</p><a href={sourceUrl} target="_blank" rel="noopener noreferrer">{sourceAction}</a></aside>
      </main>
      </div>
      <footer className="gin-official-locale-footer"><nav><Link href={localeData.homePath}>{localeData.navigation.home}</Link><Link href={officialMemberHomePaths[locale]}>{localeData.navigation.login}</Link><Link href={localeData.contactPath}>{localeData.navigation.contact}</Link><a href={localeData.navigation.sidebarJoinHref} target="_blank" rel="noopener noreferrer">{localeData.navigation.sidebarJoin}</a></nav><nav aria-label="More official GIN pages">{Object.values(officialPublicReferencePages[locale]).map((item) => <Link key={item.slug} href={`/${locale}/${item.slug}`}>{item.label}</Link>)}</nav><nav aria-label="Change language">{officialPublicLocaleCodes.map((code) => <Link key={code} href={referencePageKey ? officialReferencePagePath(code, referencePageKey) : officialLocalePathForPage(code, pageKey)} lang={officialPublicLocales[code].htmlLang}>{officialPublicLocales[code].label}</Link>)}</nav><p>Copyright © {new Date().getFullYear()} Global Information Network. All rights reserved.</p></footer>
    </div>
  );
}
