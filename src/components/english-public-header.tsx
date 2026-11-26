import Image from "next/image";
import Link from "next/link";
import LocaleSwitcher from "@/components/locale-switcher";

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
  ["Member Benefits", "/en/member-benefits"],
  ["GIN Success System", "/en/the-gin-success-system"],
  ["GIN Events", "/en/our-events"],
  ["GIN Hotel Collection", "/en/gin-hotels"],
  ["GIN Clubhouses", "/en/clubhouses-and-lodges"],
  ["GIN Cruise Ship", "/en/the-gin-cruise-ship"],
  ["Membership Levels", "/en/membership-levels"],
  ["Frequently Asked Questions", "/en/faq"],
  ["Portal Login", "/en/login"],
  ["Become a Member", "https://signup.globalinformationnetwork.com/"],
];

function NavigationLinks({ mobile = false }: { mobile?: boolean }) {
  return (
    <>
      {primaryLinks.map(([label, href]) => href.startsWith("https://") ? (
        <a href={href} key={label} target="_blank" rel="noreferrer">{label}</a>
      ) : <Link href={href} key={label}>{label}</Link>)}
      {mobile && secondaryLinks.map(([label, href]) => href.startsWith("https://") ? (
        <a href={href} key={`secondary-${label}`} target="_blank" rel="noreferrer">{label}</a>
      ) : <Link href={href} key={`secondary-${label}`}>{label}</Link>)}
    </>
  );
}

export default function EnglishPublicHeader() {
  return (
    <header className="gin-en-header">
      <Link href="/en" className="gin-en-masthead" aria-label="Global Information Network home">
        <Image src="/gin/reference-header-banner.jpg" alt="The Global Information Network — Sovereignty, Wealth, Freedom" fill priority sizes="100vw" />
      </Link>
      <div className="gin-en-mobile-tools">
        <LocaleSwitcher initialLocale="en" />
        <details className="gin-en-mobile-menu">
          <summary aria-label="Open navigation"><span/><span/><span/></summary>
          <nav aria-label="Mobile navigation"><NavigationLinks mobile /></nav>
        </details>
      </div>
      <div className="gin-en-primary-bar">
        <div className="gin-en-primary-inner">
          <LocaleSwitcher initialLocale="en" />
          <nav aria-label="Primary navigation"><NavigationLinks /></nav>
        </div>
      </div>
    </header>
  );
}
