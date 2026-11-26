import type { Metadata } from "next";
import { redirect } from "next/navigation";
import EnglishStaffLanding from "@/components/english-staff-landing";
import { getSession, hasRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Event Management Workspace", robots: { index: false, follow: false } };

export default async function EnglishEventsManagerWorkspace() {
  const user = await getSession();
  if (!user) redirect("/en/login?next=%2Fen%2Fevents-manager");
  if (!(await hasRole(user, "event_manager"))) redirect("/en/dashboard");
  return <EnglishStaffLanding title="Event Management Workspace" description="Manage published events, registration capacity, attendance and member communications." openLabel="Open Event Management Tools" openHref="/events-manager" modules={[
    { title: "Event Listings", description: "Create, update and publish event information.", href: "/events-manager" },
    { title: "Registrations", description: "Review event registrations and capacity.", href: "/events-manager" },
    { title: "Attendance", description: "Review event attendance and completion.", href: "/events-manager" },
  ]} />;
}
