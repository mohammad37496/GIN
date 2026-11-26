import type { Metadata } from "next";
import Link from "next/link";
import PublicHeader from "@/components/public-header";
import PublicFooter from "@/components/public-footer";
import SupportForm from "@/components/support-form";
import SupportInbox from "@/components/support-inbox";
import { getSession } from "@/lib/auth";
export const dynamic="force-dynamic";
const supportTitle="پشتیبانی اعضا";
const supportDescription="برای درخواست کمک درباره حساب کاربری، دوره‌ها، ثبت‌نام رویدادها یا دسترسی‌های پورتال، با تیم پشتیبانی GIN در ارتباط باشید.";
export const metadata:Metadata={title:supportTitle,description:supportDescription,alternates:{canonical:"/fa/support",languages:{fa:"/fa/support",en:"/en/support"}},robots:{index:false,follow:false},openGraph:{title:supportTitle,description:supportDescription,url:"/fa/support",siteName:"Global Information Network",locale:"fa_IR",type:"article",images:[{url:"/gin/gin-social-card.png",width:1200,height:630,alt:supportTitle}]},twitter:{card:"summary_large_image",title:supportTitle,description:supportDescription,images:["/gin/gin-social-card.png"]}};
export default async function SupportPage(){const user=await getSession();return <><PublicHeader/><main className="profile-page"><div className="public-container"><div className="page-breadcrumb"><Link href="/">خانه</Link><span>/</span><span>پشتیبانی</span></div><h1 className="page-title">{supportTitle}</h1><SupportForm authenticated={Boolean(user)}/>{user&&<SupportInbox/>}</div></main><PublicFooter/></>}
