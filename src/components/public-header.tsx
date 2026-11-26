import Link from "next/link";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { GinLogo } from "@/components/gin-brand";

const links = [
  ["خانه", "/"],
  ["درباره GIN", "/about"],
  ["چرا عضویت؟", "/why-join"],
  ["آنچه ارائه می‌دهیم", "/what-we-offer"],
  ["مزایای اعضا", "/member-benefits"],
  ["سیستم موفقیت", "/success-system"],
  ["دوره‌ها", "/courses"],
  ["رویدادها", "/events"],
  ["هتل‌ها و اقامتگاه‌ها", "/hotels"],
  ["کلاب‌ها", "/clubhouses"],
  ["سفرهای گروهی", "/cruise"],
  ["سطوح عضویت", "/membership"],
  ["پرسش‌های متداول", "/faq"],
  ["تماس با ما", "/contact"],
];

export default function PublicHeader() {
  return <>
    <header className="public-header"><div className="public-container header-inner">
      <Link href="/" className="public-brand reference-brand" aria-label="GIN صفحه اصلی"><GinLogo width={300} height={68} /></Link>
    </div></header>
    <div className="reference-navigation">
      <div className="public-container reference-navigation-inner">
      <nav className="desktop-nav" aria-label="ناوبری اصلی">
        <Link href="/">خانه</Link>
        <details className="desktop-nav-dropdown"><summary>آشنایی با GIN <ChevronDown size={13}/></summary><div>{links.slice(1, 6).map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}</div></details>
        <Link href="/courses">کتابخانه آموزش</Link>
        <Link href="/events">رویدادها</Link>
        <details className="desktop-nav-dropdown"><summary>اطلاعات اعضا <ChevronDown size={13}/></summary><div>{links.slice(8, 13).map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}</div></details>
        <Link href="/contact">تماس</Link>
      </nav>
      <div className="header-actions"><Link href="/login" className="header-login">ورود اعضا</Link><Link href="/register" className="button button-small">درخواست عضویت <ArrowLeft size={15}/></Link></div>
      <details className="mobile-menu"><summary aria-label="باز کردن منو"><span/><span/><span/></summary><nav>{links.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}<Link href="/login">ورود اعضا</Link><Link href="/register">درخواست عضویت</Link></nav></details>
      </div>
    </div>
  </>;
}
