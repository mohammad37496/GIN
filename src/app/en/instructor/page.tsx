import type { Metadata } from "next";
import { redirect } from "next/navigation";
import EnglishStaffLanding from "@/components/english-staff-landing";
import { getSession, hasRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Instructor Workspace", robots: { index: false, follow: false } };

export default async function EnglishInstructorWorkspace() {
  const user = await getSession();
  if (!user) redirect("/en/login?next=%2Fen%2Finstructor");
  if (!(await hasRole(user, "instructor"))) redirect("/en/dashboard");
  return <EnglishStaffLanding title="Instructor Workspace" description="Manage assigned courses, lessons, learning resources and student progress." openLabel="Open Instructor Tools" openHref="/instructor" modules={[
    { title: "Assigned Courses", description: "Review courses assigned to your instructor account.", href: "/instructor" },
    { title: "Lessons and Resources", description: "Manage lesson material and learning resources.", href: "/instructor" },
    { title: "Student Progress", description: "Review learner progress and completion status.", href: "/instructor" },
  ]} />;
}
