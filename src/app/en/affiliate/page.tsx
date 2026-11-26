import type { Metadata } from "next";
import { redirect } from "next/navigation";
import StaffHeader from "@/components/staff-header";
import AdminAffiliates from "@/components/admin-affiliates";
import { canManageAffiliates, canManageFinance, getSession, hasRole } from "@/lib/auth";
export const metadata: Metadata = { title: "Affiliate Workspace", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function EnglishAffiliateWorkspace() {
  const user = await getSession();
  if (!user) redirect("/en/login?next=%2Fen%2Faffiliate");
  const [roleAccess, affiliateAccess, financeAccess] = await Promise.all([hasRole(user, "affiliate_manager"), canManageAffiliates(user), canManageFinance(user)]);
  if (!roleAccess || !affiliateAccess) redirect("/en/dashboard");
  return <main className="dashboard" lang="en" dir="ltr"><StaffHeader area="AFFILIATE" locale="en" />
    <section className="admin-intro"><div><span className="eyebrow">AFFILIATE MANAGEMENT</span><h1>Affiliate workspace</h1><p>Review affiliate accounts, commissions, referral rules and payout requests.</p></div></section>
    <AdminAffiliates canManageAffiliates={affiliateAccess} canManagePayouts={financeAccess} locale="en" />
  </main>;
}
