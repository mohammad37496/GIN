import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
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
import { ShieldCheck } from "lucide-react";
import StaffHeader from "@/components/staff-header";

export default async function AdminPage(){const user=await getSession();if(!user)redirect("/login");if(user.role!=="admin")redirect("/dashboard");return <main className="dashboard"><StaffHeader area="ADMIN"/><section className="admin-intro"><div className="auth-icon"><ShieldCheck/></div><div><span className="eyebrow">CONTROL CENTER</span><h1>مدیریت پورتال</h1><p>اعضا، دوره‌ها، آزمون‌ها، عضویت‌ها، رویدادها، پشتیبانی، مالی و همکاری در فروش را از این بخش مدیریت کنید.</p></div></section><AdminPassword/><AdminCourseCategories/><AdminCourses/><AdminAssessments/><AdminMemberships/><AdminEvents/><AdminAffiliates canManageAffiliates={true} canManagePayouts={true}/><AdminFinance/><AdminSupport/><AdminUsers/></main>}
