import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut,MessageSquare } from "lucide-react";
import AdminSupport from "@/components/admin-support";
import { getSession,hasRole } from "@/lib/auth";
import { GinMark } from "@/components/gin-brand";
export const dynamic="force-dynamic";
export default async function SupportCenterPage(){const user=await getSession();if(!user)redirect("/login");if(!(await hasRole(user,"support")))redirect("/dashboard");return <main className="dashboard"><header className="dash-header"><Link href="/" className="brand"><GinMark/> GIN <span className="admin-tag">SUPPORT</span></Link><form action="/api/auth/logout" method="post"><button className="logout-button"><LogOut size={16}/> خروج</button></form></header><section className="admin-intro"><div className="auth-icon"><MessageSquare/></div><div><span className="eyebrow">SUPPORT TEAM</span><h1>مرکز پشتیبانی</h1><p>فقط درخواست‌هایی که برای تیم پشتیبانی مجاز هستند نمایش داده می‌شوند.</p></div></section><AdminSupport/></main>}
