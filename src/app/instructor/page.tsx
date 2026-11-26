import { redirect } from "next/navigation";
import { GraduationCap } from "lucide-react";
import AdminCourses from "@/components/admin-courses";
import AdminAssessments from "@/components/admin-assessments";
import { getSession,hasRole } from "@/lib/auth";
import StaffHeader from "@/components/staff-header";

export const dynamic="force-dynamic";
export default async function InstructorPage(){const user=await getSession();if(!user)redirect("/login");if(user.role==="admin")redirect("/admin");if(!(await hasRole(user,"instructor")))redirect("/dashboard");return <main className="dashboard"><StaffHeader area="INSTRUCTOR"/><section className="admin-intro"><div className="auth-icon"><GraduationCap/></div><div><span className="eyebrow">INSTRUCTOR SPACE</span><h1>فضای مدرس</h1><p>فقط دوره‌هایی که به شما اختصاص داده شده‌اند در این بخش قابل مدیریت هستند.</p></div></section><AdminCourses showInstructorTools={false}/><AdminAssessments/></main>}
