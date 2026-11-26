import Link from "next/link";
import { redirect } from "next/navigation";
import { CreditCard,LogOut } from "lucide-react";
import AdminFinance from "@/components/admin-finance";
import AdminAffiliates from "@/components/admin-affiliates";
import { canManageAffiliates,canManageFinance,getSession } from "@/lib/auth";
import { GinMark } from "@/components/gin-brand";

export const dynamic="force-dynamic";

export default async function FinanceCenterPage(){
  const user=await getSession();
  if(!user)redirect("/login");
  const [financeAccess,affiliateAccess]=await Promise.all([canManageFinance(user),canManageAffiliates(user)]);
  if(!financeAccess&&!affiliateAccess)redirect("/dashboard");
  return <main className="dashboard">
    <header className="dash-header"><Link href="/" className="brand"><GinMark/> GIN <span className="admin-tag">FINANCE</span></Link><form action="/api/auth/logout" method="post"><button className="logout-button"><LogOut size={16}/> خروج</button></form></header>
    <section className="admin-intro"><div className="auth-icon"><CreditCard/></div><div><span className="eyebrow">FINANCE CONTROL</span><h1>مرکز مالی و همکاری در فروش</h1><p>گزارش مالی، سفارش‌ها، کمیسیون‌ها و درخواست‌های تسویه بر اساس نقش سازمانی شما.</p></div></section>
    {financeAccess&&<AdminFinance/>}
    {(financeAccess||affiliateAccess)&&<AdminAffiliates canManageAffiliates={affiliateAccess} canManagePayouts={financeAccess}/>}
  </main>;
}
