import { redirect } from "next/navigation";
import Link from "next/link";
import PublicHeader from "@/components/public-header";
import PublicFooter from "@/components/public-footer";
import SupportInbox from "@/components/support-inbox";
import { getSession } from "@/lib/auth";
export const dynamic="force-dynamic";
export default async function SupportPage(){const user=await getSession();if(!user)redirect("/login?next=%2Fsupport");return <><PublicHeader/><main className="profile-page"><div className="public-container"><div className="page-breadcrumb"><Link href="/">خانه</Link><span>/</span><span>پشتیبانی</span></div><SupportInbox/></div></main><PublicFooter/></>}
