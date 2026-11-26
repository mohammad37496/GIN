import { redirect } from "next/navigation";
import { CalendarDays } from "lucide-react";
import AdminEvents from "@/components/admin-events";
import { getSession,hasRole } from "@/lib/auth";
import StaffHeader from "@/components/staff-header";
export const dynamic="force-dynamic";
export default async function EventsManagerPage(){const user=await getSession();if(!user)redirect("/login");if(!(await hasRole(user,"event_manager")))redirect("/dashboard");return <main className="dashboard"><StaffHeader area="EVENTS"/><section className="admin-intro"><div className="auth-icon"><CalendarDays/></div><div><span className="eyebrow">EVENT MANAGEMENT</span><h1>مدیریت رویدادها</h1><p>ایجاد، انتشار و مدیریت ظرفیت و فهرست شرکت‌کنندگان رویدادها.</p></div></section><AdminEvents/></main>}
