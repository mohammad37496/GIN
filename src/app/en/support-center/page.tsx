import type { Metadata } from "next";
import { redirect } from "next/navigation";
import EnglishStaffLanding from "@/components/english-staff-landing";
import { getSession, hasRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Support Team Workspace", robots: { index: false, follow: false } };

export default async function EnglishSupportWorkspace() {
  const user = await getSession();
  if (!user) redirect("/en/login?next=%2Fen%2Fsupport-center");
  if (!(await hasRole(user, "support"))) redirect("/en/dashboard");
  return <EnglishStaffLanding title="Support Team Workspace" description="Review member support conversations and public contact requests." openLabel="Open Support Tools" openHref="/support-center" modules={[
    { title: "Member Support", description: "Review and respond to member support conversations.", href: "/support-center" },
    { title: "Public Contact Requests", description: "Review contact requests submitted from the public English site.", href: "/support-center#contact-submissions" },
  ]} />;
}
