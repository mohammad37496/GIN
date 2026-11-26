import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CreditCard } from "lucide-react";
import StaffHeader from "@/components/staff-header";
import AdminFinance from "@/components/admin-finance";
import AdminAffiliates from "@/components/admin-affiliates";
import { canManageAffiliates, canManageFinance, getSession } from "@/lib/auth";
export const metadata: Metadata = { title: "Finance Workspace", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function EnglishFinanceWorkspace() {
  const user = await getSession();
  if (!user) redirect("/en/login?next=%2Fen%2Ffinance-center");
  const [financeAccess, affiliateAccess] = await Promise.all([canManageFinance(user), canManageAffiliates(user)]);
  if (!financeAccess && !affiliateAccess) redirect("/en/dashboard");
  return <main className="dashboard" lang="en" dir="ltr"><StaffHeader area="FINANCE" locale="en" />
    <section className="admin-intro"><div className="auth-icon"><CreditCard /></div><div><span className="eyebrow">FINANCE CONTROL</span><h1>Finance and affiliate center</h1><p>Review financial activity and affiliate settlements according to your assigned role.</p></div></section>
    {financeAccess && <AdminFinance locale="en" />}
    {(financeAccess || affiliateAccess) && <AdminAffiliates canManageAffiliates={affiliateAccess} canManagePayouts={financeAccess} locale="en" />}
  </main>;
}
