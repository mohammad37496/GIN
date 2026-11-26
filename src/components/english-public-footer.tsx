import Link from "next/link";

const footerLinks = [
  ["Who We Are", "/en/who-we-are"],
  ["What We Offer", "/en/what-we-offer"],
  ["Member Benefits", "/en/member-benefits"],
  ["Wealth Creation", "/en/wealth-creation"],
  ["Financial Independence", "/en/financial-independence"],
  ["Dynamic Health", "/en/dynamic-health"],
  ["Happiness and Well-Being", "/en/happiness"],
  ["Global Networking", "/en/global-networking"],
  ["Mentorship", "/en/mentorship"],
  ["Membership Opportunities", "/en/membership-opportunities"],
  ["GIN Success System", "/en/the-gin-success-system"],
  ["GIN Events", "/en/our-events"],
  ["GIN Hotel Collection", "/en/gin-hotels"],
  ["GIN Clubhouses", "/en/clubhouses-and-lodges"],
  ["GIN Cruise Ship", "/en/the-gin-cruise-ship"],
  ["Membership Levels", "/en/membership-levels"],
  ["Frequently Asked Questions", "/en/faq"],
];

export default function EnglishPublicFooter() {
  return (
    <footer className="gin-en-footer">
      <nav className="gin-en-footer-legal" aria-label="Legal information">
        <Link href="/en/privacy-policy">Privacy Policy</Link>
        <Link href="/en/cookie-policy">Cookie Policy</Link>
        <Link href="/en/terms-of-use">Terms of Service</Link>
        <Link href="/en/member-agreement">Member Agreement</Link>
      </nav>
      <div className="gin-en-footer-links">
        <Link href="/en">Home</Link>
        <Link href="/en/login">Portal Login</Link>
        <a href="https://globalinformationnetwork.com/member-home/" target="_blank" rel="noreferrer">Official Member Login</a>
        <Link href="/en/contact-us">Contact Us</Link>
        <a href="https://signup.globalinformationnetwork.com/" target="_blank" rel="noreferrer">Become a Member</a>
        {footerLinks.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
      </div>
      <p>Copyright © {new Date().getFullYear()} Global Information Network. All rights reserved.</p>
    </footer>
  );
}
