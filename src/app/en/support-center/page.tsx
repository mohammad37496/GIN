import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MessageSquare } from "lucide-react";
import StaffHeader from "@/components/staff-header";
import AdminSupport from "@/components/admin-support";
import AdminContactSubmissions from "@/components/admin-contact-submissions";
import { getSession, hasRole } from "@/lib/auth";
export const metadata: Metadata = { title: "Support Team Workspace", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function EnglishSupportWorkspace() {
  const user = await getSession();
  if (!user) redirect("/en/login?next=%2Fen%2Fsupport-center");
  if (!(await hasRole(user, "support"))) redirect("/en/dashboard");
  return <main className="dashboard" lang="en" dir="ltr"><StaffHeader area="SUPPORT" locale="en" />
    <section className="admin-intro"><div className="auth-icon"><MessageSquare /></div><div><span className="eyebrow">SUPPORT TEAM</span><h1>Support center</h1><p>Review member conversations and public contact requests assigned to the support team.</p></div></section>
    <AdminSupport locale="en" /><AdminContactSubmissions locale="en" />
  </main>;
}
