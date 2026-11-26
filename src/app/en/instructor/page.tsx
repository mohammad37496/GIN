import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GraduationCap } from "lucide-react";
import StaffHeader from "@/components/staff-header";
import AdminCourses from "@/components/admin-courses";
import AdminAssessments from "@/components/admin-assessments";
import { getSession, hasRole } from "@/lib/auth";
export const metadata: Metadata = { title: "Instructor Workspace", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function EnglishInstructorWorkspace() {
  const user = await getSession();
  if (!user) redirect("/en/login?next=%2Fen%2Finstructor");
  if (user.role === "admin") redirect("/en/admin");
  if (!(await hasRole(user, "instructor"))) redirect("/en/dashboard");
  return <main className="dashboard" lang="en" dir="ltr"><StaffHeader area="INSTRUCTOR" locale="en" />
    <section className="admin-intro"><div className="auth-icon"><GraduationCap /></div><div><span className="eyebrow">INSTRUCTOR SPACE</span><h1>Instructor workspace</h1><p>Only courses assigned to your instructor account are available here.</p></div></section>
    <AdminCourses showInstructorTools={false} locale="en" /><AdminAssessments locale="en" />
  </main>;
}
