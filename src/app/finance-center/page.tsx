import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CreditCard } from "lucide-react";
import AdminFinance from "@/components/admin-finance";
import AdminAffiliates from "@/components/admin-affiliates";
import { canManageAffiliates,canManageFinance,getSession } from "@/lib/auth";
import StaffHeader from "@/components/staff-header";

export const metadata: Metadata = { title: "مرکز مالی و همکاری در فروش", robots: { index: false, follow: false } };

export const dynamic="force-dynamic";

export default async function FinanceCenterPage(){
  const user=await getSession();
  if(!user)redirect("/login");
  const [financeAccess,affiliateAccess]=await Promise.all([canManageFinance(user),canManageAffiliates(user)]);
  if(!financeAccess&&!affiliateAccess)redirect("/dashboard");
  return <main className="dashboard">
    <StaffHeader area="FINANCE" />
    <section className="admin-intro"><div className="auth-icon"><CreditCard/></div><div><span className="eyebrow">FINANCE CONTROL</span><h1>مرکز مالی و همکاری در فروش</h1><p>گزارش مالی، سفارش‌ها، کمیسیون‌ها و درخواست‌های تسویه بر اساس نقش سازمانی شما.</p></div></section>
    {financeAccess&&<AdminFinance/>}
    {(financeAccess||affiliateAccess)&&<AdminAffiliates canManageAffiliates={affiliateAccess} canManagePayouts={financeAccess}/>}
  </main>;
}
