import type { Metadata } from "next";
import { redirect } from "next/navigation";
import EnglishStaffLanding from "@/components/english-staff-landing";
import { getSession, hasRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Affiliate Workspace", robots: { index: false, follow: false } };

export default async function EnglishAffiliateWorkspace() {
  const user = await getSession();
  if (!user) redirect("/en/login?next=%2Fen%2Faffiliate");
  if (!(await hasRole(user, "affiliate_manager"))) redirect("/en/dashboard");
  return <EnglishStaffLanding title="Affiliate Workspace" description="Review referral links, eligible activity, commission statements and payout information." openLabel="Open Affiliate Tools" openHref="/affiliate" modules={[
    { title: "Referral Links", description: "View and share your approved referral links.", href: "/affiliate" },
    { title: "Commission Activity", description: "Review referral activity and commission status.", href: "/affiliate" },
    { title: "Payouts", description: "Review payout details and submitted requests.", href: "/affiliate" },
  ]} />;
}
