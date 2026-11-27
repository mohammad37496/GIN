import Image from "next/image";
import Link from "next/link";
import LocaleSwitcher from "@/components/locale-switcher";
import JsonLd from "@/components/json-ld";
import { buildOrganizationSchema, buildWebsiteSchema } from "@/lib/structured-data";

const primaryLinks = [
  ["Home", "/en"],
  ["Become A Member", "https://signup.globalinformationnetwork.com/"],
  ["About Us", "/en/about-us"],
  ["Contact Us", "/en/contact-us"],
  ["Login", "https://globalinformationnetwork.com/member-home/"],
];

const secondaryLinks = [
  ["Who We Are", "/en/who-we-are"],
  ["What We Offer", "/en/what-we-offer"],
  ["Wealth Creation", "/en/wealth-creation"],
  ["Financial Independence", "/en/financial-independence"],
  ["Dynamic Health", "/en/dynamic-health"],
  ["Happiness", "/en/happiness"],
  ["Global Networking", "/en/global-networking"],
  ["Mentorship", "/en/mentorship"],
  ["Membership Opportunities", "/en/membership-opportunities"],
  ["Member Benefits", "/en/member-benefits"],
  ["GIN Success System", "/en/the-gin-success-system"],
  ["GIN Events", "/en/our-events"],
  ["GIN Hotel Collection", "/en/gin-hotels"],
  ["GIN Clubhouses", "/en/clubhouses-and-lodges"],
  ["GIN Cruise Ship", "/en/the-gin-cruise-ship"],
  ["Membership Levels", "/en/membership-levels"],
  ["Frequently Asked Questions", "/en/faq"],
  ["Become a Member", "https://signup.globalinformationnetwork.com/"],
];

function NavigationLinks({ mobile = false }: { mobile?: boolean }) {
  return (
    <>
      {primaryLinks.map(([label, href]) => href.startsWith("https://") ? (
        <a href={href} key={label} target="_blank" rel="noreferrer">{label}</a>
      ) : <Link href={href} key={label} className={href === "/en" ? "gin-en-primary-home" : undefined}>{label}</Link>)}
      {mobile && secondaryLinks.map(([label, href]) => href.startsWith("https://") ? (
        <a href={href} key={`secondary-${label}`} target="_blank" rel="noreferrer">{label}</a>
      ) : <Link href={href} key={`secondary-${label}`}>{label}</Link>)}
    </>
  );
}

export function EnglishPublicSidebar() {
  return (
    <aside className="gin-en-sidebar">
      <nav aria-label="Public pages">
        {secondaryLinks.map(([label, href]) => href.startsWith("https://") ? (
          <a href={href} key={label} target="_blank" rel="noreferrer">{label}</a>
        ) : <Link href={href} key={label}>{label}</Link>)}
      </nav>
    </aside>
  );
}

export default function EnglishPublicHeader() {
  return (
    <>
    <JsonLd data={[buildOrganizationSchema(), buildWebsiteSchema()]} />
    <header className="gin-en-header">
      <Link href="/en" className="gin-en-masthead" aria-label="Global Information Network home">
        <Image src="/gin/reference-header-banner.jpg" alt="The Global Information Network — Sovereignty, Wealth, Freedom" fill priority sizes="100vw" />
      </Link>
      <div className="gin-en-mobile-tools">
        <details className="gin-en-mobile-menu">
          <summary aria-label="Open navigation"><span className="gin-en-menu-icon"><i/><i/><i/></span><span className="gin-en-menu-label">Menu</span></summary>
          <nav aria-label="Mobile navigation"><LocaleSwitcher initialLocale="en" /><NavigationLinks mobile /></nav>
        </details>
      </div>
      <div className="gin-en-primary-bar">
        <div className="gin-en-primary-inner">
          <LocaleSwitcher initialLocale="en" />
          <nav aria-label="Primary navigation"><NavigationLinks /></nav>
        </div>
      </div>
    </header>
    </>
  );
}
