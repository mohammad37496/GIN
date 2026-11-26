import { CheckCircle2,Crown } from "lucide-react";
import PublicHeader from "@/components/public-header";
import PublicFooter from "@/components/public-footer";
import MembershipRequestButton from "@/components/membership-request-button";
import MemberMembershipControls from "@/components/member-membership-controls";
import { getSession } from "@/lib/auth";
import { ensureSchema,pool } from "@/lib/db";
import { syncMembershipState } from "@/lib/membership";

export const dynamic="force-dynamic";
export const metadata: Metadata = { title: "پلن‌های عضویت پرتال", description: "پلن‌های داخلی سامانه آموزشی GIN؛ جدا از سطوح عضویت رسمی شبکه اطلاعات جهانی.", alternates: { canonical: "/fa/membership" }, robots: { index: false, follow: false } };

export default async function MembershipPage(){
  await ensureSchema();const user=await getSession();if(user)await syncMembershipState(user.id);
  const plans=await pool.query("SELECT id,code,name,description,level,price_minor,currency,billing_interval,benefits FROM membership_plans WHERE is_active=TRUE ORDER BY level,id");
  const state=user?await pool.query(`SELECT plan_id,status,starts_at FROM memberships WHERE user_id=$1 AND status IN ('active','pending') AND (ends_at IS NULL OR ends_at>NOW())
    UNION ALL SELECT plan_id,status,NULL::timestamptz AS starts_at FROM membership_requests WHERE user_id=$1 AND status='pending'`,[user.id]):{rows:[]};
  const requested=new Set(state.rows.map((row)=>Number(row.plan_id)));
  const hasActiveMembership=state.rows.some((row)=>row.status==="active"&&(!row.starts_at||new Date(row.starts_at).getTime()<=Date.now()));
  return <><PublicHeader/><main className="membership-page"><div className="public-container"><section className="catalog-heading"><span className="eyebrow">GIN MEMBERSHIP</span><h1>سطوح عضویت</h1><p>امکانات و شرایط هر سطح را بررسی کنید. دسترسی‌ها پس از فعال‌شدن عضویت در سامانه اعمال می‌شوند.</p></section>{plans.rows.length?<div className="membership-plan-grid">{plans.rows.map((plan)=>{const benefits=Array.isArray(plan.benefits)?plan.benefits as string[]:[];const free=Number(plan.price_minor)===0;return <article className="membership-plan-card" key={plan.id}><div className="membership-plan-icon"><Crown size={22}/></div><span className="eyebrow">LEVEL {plan.level}</span><h2>{plan.name}</h2><p>{plan.description}</p><div className="membership-price">{free?"رایگان":`${Number(plan.price_minor).toLocaleString("fa-IR")} ${plan.currency??""}`}<small>{plan.billing_interval==="month"?"ماهانه":plan.billing_interval==="year"?"سالانه":"بدون پرداخت دوره‌ای"}</small></div><ul>{benefits.map((benefit)=><li key={benefit}><CheckCircle2 size={15}/>{benefit}</li>)}</ul>{free?<MembershipRequestButton planId={Number(plan.id)} authenticated={Boolean(user)} disabled={false} alreadyRequested={requested.has(Number(plan.id))} hasActiveMembership={hasActiveMembership}/>:<div className="membership-payment-pending">درگاه پرداخت هنوز فعال نشده است؛ خرید آنلاین این پلن موقتاً غیرفعال است.</div>}</article>;})}</div>:<div className="catalog-empty"><Crown size={32}/><h2>هنوز پلن فعالی منتشر نشده است</h2><p>پلن‌ها پس از تعریف شرایط و امکانات توسط مدیریت در این بخش نمایش داده می‌شوند.</p></div>}{user&&<MemberMembershipControls/>}</div></main><PublicFooter/></>;
}
import type { Metadata } from "next";
