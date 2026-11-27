import Image from "next/image";
import Link from "next/link";
import { officialPublicLocales, type OfficialPublicLocaleCode } from "@/lib/official-public-locales";
import { officialEnglishReferencePages, officialPublicReferencePages, officialReferencePagePath, type OfficialReferencePageKey } from "@/lib/official-public-reference-routes";

const SIGNUP_URL = "https://signup.globalinformationnetwork.com/";
const BOOKING_URL = "https://calendly.com/d/ct4v-zq9-zqw";
const englishSidebarPageKeys: OfficialReferencePageKey[] = ["whoWeAre", "whatWeOffer", "memberBenefits", "successSystem", "events", "hotels", "clubhouses", "cruise", "membershipLevels", "faq"];
const localizedSidebarPageKeys: Record<Exclude<OfficialPublicLocaleCode, "en">, OfficialReferencePageKey[]> = {
  de: ["memberBenefits", "events", "training", "successSystem", "hotels", "cruise", "clubVision", "faq"],
  fr: ["memberBenefits", "events", "training", "successSystem", "hotels", "cruise", "clubVision", "faq"],
  es: ["memberBenefits", "events", "training", "successSystem", "hotels", "clubVision", "cruise", "faq"],
  hu: ["memberBenefits", "events", "training", "successSystem", "hotels", "cruise", "clubVision", "faq"],
  sq: ["memberBenefits", "events", "training", "successSystem", "hotels", "cruise", "clubVision", "faq"],
  pt: ["memberBenefits", "events", "training", "successSystem", "hotels", "cruise", "clubVision", "faq"],
};

export function OfficialLocaleNavigation({ locale }: { locale: OfficialPublicLocaleCode }) {
  const active = officialPublicLocales[locale];
  const links = {
    home: <Link href={active.homePath}>{active.navigation.home}</Link>,
    join: <a href={SIGNUP_URL} target="_blank" rel="noopener noreferrer">{active.navigation.join}</a>,
    about: <Link href={active.navigation.aboutHref}>{active.navigation.about}</Link>,
    contact: <Link href={active.contactPath}>{active.navigation.contact}</Link>,
    login: <a href={active.navigation.loginHref} target="_blank" rel="noopener noreferrer">{active.navigation.login}</a>,
  };
  return (
    <nav className="gin-official-locale-nav" aria-label="Primary navigation">
      {active.navigation.primaryOrder.map((key) => <span key={key}>{links[key]}</span>)}
    </nav>
  );
}

export function OfficialLocaleReferenceNavigation({ locale }: { locale: OfficialPublicLocaleCode }) {
  const pages = locale === "en" ? officialEnglishReferencePages : officialPublicReferencePages[locale];
  const keys = locale === "en" ? englishSidebarPageKeys : localizedSidebarPageKeys[locale];
  return (
    <nav aria-label="Public information pages">
      {locale !== "en" ? <Link href={officialPublicLocales[locale].aboutPath}>{officialPublicLocales[locale].navigation.sidebarAbout}</Link> : null}
      {keys.map((key) => {
        const page = pages[key];
        if (!page) return null;
        return <Link key={key} href={locale === "de" && key === "faq" ? officialReferencePagePath("en", "faq") : officialReferencePagePath(locale, key)}>{page.navigationLabel ?? page.label}</Link>;
      })}
      <a href={officialPublicLocales[locale].navigation.sidebarJoinHref} target="_blank" rel="noopener noreferrer">{officialPublicLocales[locale].navigation.sidebarJoin}</a>
    </nav>
  );
}

export function OfficialLocalePicker({ locale, pageKey = "homePath", referencePageKey }: { locale: OfficialPublicLocaleCode; pageKey?: "homePath" | "aboutPath" | "contactPath"; referencePageKey?: OfficialReferencePageKey }) {
  return (
    <details className="gin-official-locale-picker">
      <summary>{officialPublicLocales[locale].label}<span aria-hidden="true">⌄</span></summary>
      <div>{Object.entries(officialPublicLocales).map(([code, item]) => <Link key={code} href={referencePageKey ? officialReferencePagePath(code as OfficialPublicLocaleCode, referencePageKey) : item[pageKey]} lang={item.htmlLang} aria-current={code === locale ? "page" : undefined}>{item.label}</Link>)}</div>
      <Link href="/fa">فارسی · Persian portal</Link>
    </details>
  );
}

export default function OfficialPublicHome({ locale }: { locale: OfficialPublicLocaleCode }) {
  const page = officialPublicLocales[locale];
  const copy = page.copy;
  const referencePages = locale === "en" ? Object.values(officialEnglishReferencePages) : Object.values(officialPublicReferencePages[locale]);
  return (
    <div className="gin-official-locale-site" lang={page.htmlLang} dir="ltr">
      <header className="gin-official-locale-header">
        <Link href={page.homePath} className="gin-official-locale-brand" aria-label="Global Information Network home">
          <Image src="/gin/reference-header-banner.jpg" alt="Global Information Network" fill priority sizes="100vw" />
        </Link>
        <details className="gin-official-locale-mobile-menu"><summary aria-label={page.navigation.menu}><span className="gin-official-locale-menu-icon"><i/><i/><i/></span><span>{page.navigation.menu}</span></summary><div className="gin-official-locale-mobile-menu-panel"><OfficialLocalePicker locale={locale} pageKey="homePath"/><OfficialLocaleNavigation locale={locale}/><OfficialLocaleReferenceNavigation locale={locale}/></div></details>
        <div className="gin-official-locale-navigation">
          <OfficialLocalePicker locale={locale} pageKey="homePath"/>
          <OfficialLocaleNavigation locale={locale}/>
        </div>
      </header>
      <div className="gin-official-locale-layout">
      <aside className="gin-official-locale-sidebar"><OfficialLocaleReferenceNavigation locale={locale}/></aside>
      <main className="gin-official-locale-main">
        <h1>{copy.welcome}</h1>
        <Image className="gin-official-locale-hero" src="/gin/gin-banner.webp" alt={copy.welcome} width={1400} height={520} priority sizes="(max-width: 768px) 100vw, 1000px" />
        <section className="gin-official-locale-intro">
          <h2>{copy.introTitle}</h2><p>{copy.intro}</p>
          <ul>{copy.pillars.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
        <section className="gin-official-locale-video" aria-label="GIN introduction video">
          <div><iframe src="https://iframe.mediadelivery.net/embed/21211/8afabd85-d7a1-43a1-824d-b467272f0951" title={`${copy.introTitle} — video`} loading="lazy" allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/></div>
        </section>
        <section className="gin-official-locale-cta">
          <h2>{copy.join}</h2>
          <p>{copy.questions} {copy.speak}</p>
          <div><a href={SIGNUP_URL} target="_blank" rel="noopener noreferrer">{copy.join}</a><a href={BOOKING_URL} target="_blank" rel="noopener noreferrer">{copy.book}</a></div>
        </section>
        {copy.sections.map((section) => (
          <section className="gin-official-locale-content-section" key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.body}</p>
            {section.items?.length ? <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul> : null}
          </section>
        ))}
        <section className="gin-official-locale-stories">
          <h2>{copy.stories}</h2>
          <div><iframe src="https://player.mediadelivery.net/embed/34091/f9dd38fa-5c2d-43f4-a9ad-888be6ebc0cd" title={copy.stories} loading="lazy" allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/></div>
          <p>{copy.memberIntro}</p>
          <Image src="/gin/paris-intercontinental.webp" alt={copy.stories} width={720} height={480} sizes="(max-width: 768px) 100vw, 720px" />
        </section>
      </main>
      </div>
      <footer className="gin-official-locale-footer">
        <nav aria-label="Footer navigation"><Link href={page.homePath}>{page.navigation.home}</Link><a href={page.navigation.loginHref} target="_blank" rel="noopener noreferrer">{page.navigation.login}</a><Link href={page.contactPath}>{page.navigation.contact}</Link><a href={page.navigation.sidebarJoinHref} target="_blank" rel="noopener noreferrer">{page.navigation.sidebarJoin}</a></nav>
        {referencePages.length ? <nav aria-label="More official GIN pages">{referencePages.map((item) => <Link key={item.slug} href={`/${locale}/${item.slug}`}>{item.label}</Link>)}</nav> : null}
        <nav aria-label="Change language">{Object.entries(officialPublicLocales).map(([code, item]) => <Link key={code} href={item.homePath} lang={item.htmlLang}>{item.label}</Link>)}</nav>
        <p>Copyright © {new Date().getFullYear()} Global Information Network. All rights reserved.</p>
      </footer>
    </div>
  );
}
