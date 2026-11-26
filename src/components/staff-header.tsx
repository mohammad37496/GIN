import Link from "next/link";
import { LogOut } from "lucide-react";
import { GinLogo, GinMark } from "@/components/gin-brand";

export default function StaffHeader({ area }: { area: string }) {
  return (
    <header className="dash-header staff-header">
      <Link href="/" className="brand staff-brand" aria-label={`GIN — Global Information Network — ${area}`}>
        <GinLogo width={220} height={50} className="staff-brand-full" />
        <span className="staff-brand-compact"><GinMark size={36} /><strong>GIN</strong></span>
        <span className="admin-tag">{area}</span>
      </Link>
      <nav className="staff-header-nav" aria-label="ناوبری فضای کاری">
        <Link href="/dashboard">داشبورد</Link>
        <Link href="/courses">کتابخانه آموزش</Link>
        <Link href="/events">رویدادها</Link>
        <Link href="/">وب‌سایت</Link>
        <form action="/api/auth/logout" method="post">
          <button className="logout-button"><LogOut size={16} /> خروج</button>
        </form>
      </nav>
    </header>
  );
}
