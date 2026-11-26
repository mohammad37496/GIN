"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, LockKeyhole } from "lucide-react";

export default function CourseEnrollButton({ slug, isAuthenticated, isEnrolled, accessType }: { slug: string; isAuthenticated: boolean; isEnrolled: boolean; accessType: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  if (isEnrolled) return <span className="course-enrolled"><CheckCircle2 size={17}/> ثبت‌نام‌شده</span>;
  if (accessType === "paid") return <span className="course-locked"><LockKeyhole size={16}/> خرید این دوره پس از فعال‌شدن درگاه پرداخت در دسترس خواهد بود</span>;
  async function enroll() {
    if (!isAuthenticated) { router.push(`/login?next=${encodeURIComponent(`/courses/${slug}`)}`); return; }
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/courses/${encodeURIComponent(slug)}/enroll`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "ثبت‌نام انجام نشد.");
      router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "خطا در ثبت‌نام"); }
    finally { setBusy(false); }
  }
  return <div className="course-enroll-wrap"><button className="button" onClick={enroll} disabled={busy}>{busy ? "در حال ثبت‌نام..." : accessType === "members" ? "ثبت‌نام با عضویت فعال" : "ثبت‌نام رایگان"}<ArrowLeft size={16}/></button>{error && <small className="course-error">{error}</small>}</div>;
}
