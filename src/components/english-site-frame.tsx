import Link from "next/link";
import EnglishPublicHeader from "@/components/english-public-header";
import EnglishPublicFooter from "@/components/english-public-footer";

const sideLinks = [
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
  ["Portal Login", "/en/login"],
  ["Become a Member", "/en/become-a-member"],
];

export default function EnglishSiteFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="gin-en-site" lang="en" dir="ltr">
      <EnglishPublicHeader />
      <div className="gin-en-shell">
        <aside className="gin-en-sidebar" aria-label="GIN sections">
          <nav>{sideLinks.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}</nav>
        </aside>
        <main className="gin-en-main">{children}</main>
      </div>
      <EnglishPublicFooter />
    </div>
  );
}
