import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CalendarDays } from "lucide-react";
import StaffHeader from "@/components/staff-header";
import AdminEvents from "@/components/admin-events";
import { getSession, hasRole } from "@/lib/auth";
export const metadata: Metadata = { title: "Event Management Workspace", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function EnglishEventsManagerWorkspace() {
  const user = await getSession();
  if (!user) redirect("/en/login?next=%2Fen%2Fevents-manager");
  if (!(await hasRole(user, "event_manager"))) redirect("/en/dashboard");
  return <main className="dashboard" lang="en" dir="ltr"><StaffHeader area="EVENTS" locale="en" />
    <section className="admin-intro"><div className="auth-icon"><CalendarDays /></div><div><span className="eyebrow">EVENT MANAGEMENT</span><h1>Event management</h1><p>Create, publish and manage event capacity and attendee lists.</p></div></section>
    <AdminEvents locale="en" />
  </main>;
}
