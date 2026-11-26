import Link from "next/link";
import { GinLogo } from "@/components/gin-brand";

export default function PublicFooter() {
  return <footer className="public-footer"><div className="public-container footer-main">
    <div className="footer-brand"><Link href="/" className="public-brand footer-logo" aria-label="GIN صفحه اصلی"><GinLogo variant="light" width={250} height={57} /></Link><p>جامعه‌ای برای یادگیری، ارتباط و رشد در حوزه‌های سلامت، ثروت و شادی.</p><Link href="/register" className="footer-join-link">درخواست عضویت <span>←</span></Link></div>
    <div><h3>درباره GIN</h3><Link href="/who-we-are">ما که هستیم</Link><Link href="/why-join">چرا عضویت در GIN؟</Link><Link href="/what-we-offer">آنچه ارائه می‌دهیم</Link><Link href="/success-system">سیستم موفقیت</Link><Link href="/member-benefits">مزایای اعضا</Link></div>
    <div><h3>جامعه و رویدادها</h3><Link href="/events">رویدادهای GIN</Link><Link href="/hotels">مجموعه هتل‌ها</Link><Link href="/clubhouses">کلاب‌ها و اقامتگاه‌ها</Link><Link href="/cruise">سفرهای گروهی</Link><Link href="/membership">سطوح عضویت</Link></div>
    <div><h3>راهنما و حساب کاربری</h3><Link href="/courses">کتابخانه آموزش</Link><Link href="/faq">پرسش‌های متداول</Link><Link href="/contact">تماس با ما</Link><Link href="/register">درخواست عضویت</Link><Link href="/login">ورود اعضا</Link></div>
  </div><div className="public-container footer-bottom"><span>© {new Date().getFullYear()} Global Information Network</span><span>تمام حقوق این پلتفرم محفوظ است.</span></div></footer>;
}
