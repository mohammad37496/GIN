import type { Metadata } from "next";
import { redirect } from "next/navigation";
import EnglishStaffLanding from "@/components/english-staff-landing";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Administration Workspace", robots: { index: false, follow: false } };

export default async function EnglishAdminWorkspace() {
  const user = await getSession();
  if (!user) redirect("/en/login?next=%2Fen%2Fadmin");
  if (user.role !== "admin") redirect("/en/dashboard");
  return <EnglishStaffLanding title="Administration Workspace" description="Manage members, courses, assessments, memberships, events, affiliates, finance and support." openLabel="Open Administration Tools" openHref="/admin" modules={[
    { title: "Members and Accounts", description: "Review portal accounts, access and member records.", href: "/admin" },
    { title: "Courses and Assessments", description: "Manage learning content, categories and assessments.", href: "/admin" },
    { title: "Memberships", description: "Review membership requests and account plans.", href: "/admin" },
    { title: "Events", description: "Manage event listings and registrations.", href: "/admin" },
    { title: "Finance and Affiliates", description: "Review financial activity, referrals and payouts.", href: "/admin" },
    { title: "Support and Contact Requests", description: "Review member support messages and public contact requests.", href: "/admin#contact-submissions" },
  ]} />;
}
