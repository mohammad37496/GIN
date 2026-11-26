import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MessageSquare } from "lucide-react";
import AdminSupport from "@/components/admin-support";
import { getSession,hasRole } from "@/lib/auth";
import StaffHeader from "@/components/staff-header";
import AdminContactSubmissions from "@/components/admin-contact-submissions";

export const metadata: Metadata = { title: "مرکز پشتیبانی", robots: { index: false, follow: false } };
export const dynamic="force-dynamic";
export default async function SupportCenterPage(){const user=await getSession();if(!user)redirect("/login");if(!(await hasRole(user,"support")))redirect("/dashboard");return <main className="dashboard"><StaffHeader area="SUPPORT"/><section className="admin-intro"><div className="auth-icon"><MessageSquare/></div><div><span className="eyebrow">SUPPORT TEAM</span><h1>مرکز پشتیبانی</h1><p>فقط درخواست‌هایی که برای تیم پشتیبانی مجاز هستند نمایش داده می‌شوند.</p></div></section><AdminSupport/><AdminContactSubmissions/></main>}
