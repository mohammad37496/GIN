import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays,LogOut } from "lucide-react";
import AdminEvents from "@/components/admin-events";
import { getSession,hasRole } from "@/lib/auth";
import { GinMark } from "@/components/gin-brand";
export const dynamic="force-dynamic";
export default async function EventsManagerPage(){const user=await getSession();if(!user)redirect("/login");if(!(await hasRole(user,"event_manager")))redirect("/dashboard");return <main className="dashboard"><header className="dash-header"><Link href="/" className="brand"><GinMark/> GIN <span className="admin-tag">EVENTS</span></Link><form action="/api/auth/logout" method="post"><button className="logout-button"><LogOut size={16}/> خروج</button></form></header><section className="admin-intro"><div className="auth-icon"><CalendarDays/></div><div><span className="eyebrow">EVENT MANAGEMENT</span><h1>مدیریت رویدادها</h1><p>ایجاد، انتشار و مدیریت ظرفیت و فهرست شرکت‌کنندگان رویدادها.</p></div></section><AdminEvents/></main>}
