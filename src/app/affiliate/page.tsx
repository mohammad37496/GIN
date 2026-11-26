import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import PublicHeader from "@/components/public-header";
import PublicFooter from "@/components/public-footer";
import AffiliateDashboard from "@/components/affiliate-dashboard";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "همکاری در فروش", robots: { index: false, follow: false } };

export const dynamic="force-dynamic";
export default async function AffiliatePage(){const user=await getSession();if(!user)redirect("/login?next=%2Faffiliate");return <><PublicHeader/><main className="profile-page"><div className="public-container"><div className="page-breadcrumb"><Link href="/">خانه</Link><span>/</span><span>همکاری در فروش</span></div><AffiliateDashboard/></div></main><PublicFooter/></>}
