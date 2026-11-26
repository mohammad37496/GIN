import Link from "next/link";
import { headers } from "next/headers";
import { LogOut } from "lucide-react";
import { GinLogo, GinMark } from "@/components/gin-brand";
import LocaleSwitcher from "@/components/locale-switcher";

export default async function StaffHeader({ area, locale: requestedLocale }: { area: string; locale?: "fa" | "en" }) {
  const locale = requestedLocale ?? ((await headers()).get("x-website-locale") === "en" ? "en" : "fa");
  const english = locale === "en";
  return (
    <header className="dash-header staff-header">
      <Link href={english ? "/en" : "/"} className="brand staff-brand" aria-label={`GIN — Global Information Network — ${area}`}>
        <GinLogo width={220} height={50} className="staff-brand-full" />
        <span className="staff-brand-compact"><GinMark size={36} /><strong>GIN</strong></span>
        <span className="admin-tag">{area}</span>
      </Link>
      <nav className="staff-header-nav" aria-label={english ? "Workspace navigation" : "ناوبری فضای کاری"}>
        <LocaleSwitcher initialLocale={locale} />
        <Link href={english ? "/en/dashboard" : "/dashboard"}>{english ? "Dashboard" : "داشبورد"}</Link>
        <Link href={english ? "/en/courses" : "/courses"}>{english ? "Learning library" : "کتابخانه آموزش"}</Link>
        <Link href={english ? "/en/events" : "/events"}>{english ? "Events" : "رویدادها"}</Link>
        <Link href={english ? "/en" : "/"}>{english ? "Website" : "وب‌سایت"}</Link>
        <form action={`/api/auth/logout?locale=${locale}`} method="post">
          <button className="logout-button"><LogOut size={16} /> {english ? "Sign out" : "خروج"}</button>
        </form>
      </nav>
    </header>
  );
}
