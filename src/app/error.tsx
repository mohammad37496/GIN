"use client";

import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { AlertCircle, RefreshCw } from "lucide-react";
import { GinLogo } from "@/components/gin-brand";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  unstable_rethrow(error);
  return (
    <main className="system-page" dir="rtl">
      <GinLogo width={230} height={52} />
      <section className="system-card">
        <AlertCircle size={34} />
        <span className="eyebrow">GIN PORTAL</span>
        <h1>بارگذاری این بخش با مشکل روبه‌رو شد</h1>
        <p>می‌توانید دوباره تلاش کنید یا به صفحه اصلی برگردید. اگر مشکل ادامه داشت، با پشتیبانی تماس بگیرید.</p>
        <div className="system-actions">
          <button className="button" onClick={() => reset()}>تلاش دوباره <RefreshCw size={16} /></button>
          <Link className="text-arrow" href="/contact">تماس با پشتیبانی</Link>
        </div>
      </section>
    </main>
  );
}
