import Link from "next/link";
import { ArrowRight, SearchX } from "lucide-react";
import { GinLogo } from "@/components/gin-brand";

export default function NotFound() {
  return (
    <main className="system-page" dir="rtl">
      <Link href="/" aria-label="GIN صفحه اصلی"><GinLogo width={230} height={52} /></Link>
      <section className="system-card">
        <SearchX size={34} />
        <span className="eyebrow">404 · PAGE NOT FOUND</span>
        <h1>این صفحه پیدا نشد</h1>
        <p>نشانی واردشده معتبر نیست یا این صفحه دیگر در دسترس نیست.</p>
        <div className="system-actions">
          <Link className="button" href="/">بازگشت به صفحه اصلی <ArrowRight size={16} /></Link>
          <Link className="text-arrow" href="/courses">مشاهده کتابخانه آموزش</Link>
        </div>
      </section>
    </main>
  );
}
