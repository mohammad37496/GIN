import type { Metadata } from "next";
import { redirect } from "next/navigation";
import EnglishStaffLanding from "@/components/english-staff-landing";
import { getSession, hasRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Finance Workspace", robots: { index: false, follow: false } };

export default async function EnglishFinanceWorkspace() {
  const user = await getSession();
  if (!user) redirect("/en/login?next=%2Fen%2Ffinance-center");
  if (!(await hasRole(user, "finance")) && !(await hasRole(user, "affiliate_manager"))) redirect("/en/dashboard");
  return <EnglishStaffLanding title="Finance Workspace" description="Review invoices, commissions, settlements, affiliate activity and payout records." openLabel="Open Finance Tools" openHref="/finance-center" modules={[
    { title: "Invoices and Payments", description: "Review payment records and invoice status.", href: "/finance-center" },
    { title: "Commissions and Settlements", description: "Review eligible commissions and settlement records.", href: "/finance-center" },
    { title: "Affiliate Payouts", description: "Review payout requests and processing status.", href: "/finance-center" },
  ]} />;
}
