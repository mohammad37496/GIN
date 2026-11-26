import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import StaffHeader from "@/components/staff-header";
import AdminUsers from "@/components/admin-users";
import AdminPassword from "@/components/admin-password";
import AdminCourses from "@/components/admin-courses";
import AdminEvents from "@/components/admin-events";
import AdminMemberships from "@/components/admin-memberships";
import AdminAffiliates from "@/components/admin-affiliates";
import AdminFinance from "@/components/admin-finance";
import AdminCourseCategories from "@/components/admin-course-categories";
import AdminAssessments from "@/components/admin-assessments";
import AdminSupport from "@/components/admin-support";
import AdminContactSubmissions from "@/components/admin-contact-submissions";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Administration Workspace", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function EnglishAdminWorkspace() {
  const user = await getSession();
  if (!user) redirect("/en/login?next=%2Fen%2Fadmin");
  if (user.role !== "admin") redirect("/en/dashboard");
  return <main className="dashboard" lang="en" dir="ltr">
    <StaffHeader area="ADMIN" locale="en" />
    <section className="admin-intro"><div className="auth-icon"><ShieldCheck /></div><div><span className="eyebrow">CONTROL CENTER</span><h1>Administration workspace</h1><p>Manage members, learning content, assessments, memberships, events, finance, affiliates and support.</p></div></section>
    <AdminPassword locale="en" /><AdminCourseCategories locale="en" /><AdminCourses locale="en" /><AdminAssessments locale="en" /><AdminMemberships locale="en" /><AdminEvents locale="en" />
    <AdminAffiliates canManageAffiliates={true} canManagePayouts={true} locale="en" /><AdminFinance locale="en" /><AdminSupport locale="en" /><AdminContactSubmissions locale="en" /><AdminUsers locale="en" />
  </main>;
}
