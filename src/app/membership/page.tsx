import Link from "next/link";
import { CheckCircle2,Crown } from "lucide-react";
import PublicHeader from "@/components/public-header";
import PublicFooter from "@/components/public-footer";
import MembershipRequestButton from "@/components/membership-request-button";
import MemberMembershipControls from "@/components/member-membership-controls";
import { getSession } from "@/lib/auth";
import { ensureSchema,pool } from "@/lib/db";
import { syncMembershipState } from "@/lib/membership";

export const dynamic="force-dynamic";

const referenceLevels = [
  [1, "عضو سطح اول", "Member"],
  [2, "عضو سطح دوم", "Member"],
  [3, "عضو سطح سوم", "Member"],
  [4, "عضو سطح چهارم", "Member"],
  [5, "عضو سطح پنجم", "Member"],
  [6, "عضو اجرایی", "Executive Member"],
  [7, "افسر ارشد", "Senior Officer"],
  [8, "مدیر", "Director"],
  [9, "باشگاه رؤسا", "Presidents Club"],
  [10, "باشگاه رئیس هیئت‌مدیره", "Chairman’s Club"],
  [11, "حلقه درونی", "Inner Circle"],
  [12, "شریک", "Partner"],
] as const;

export default async function MembershipPage(){
  await ensureSchema();const user=await getSession();if(user)await syncMembershipState(user.id);
  const plans=await pool.query("SELECT id,code,name,description,level,price_minor,currency,billing_interval,benefits FROM membership_plans WHERE is_active=TRUE ORDER BY level,id");
  const state=user?await pool.query(`SELECT plan_id,status,starts_at FROM memberships WHERE user_id=$1 AND status IN ('active','pending') AND (ends_at IS NULL OR ends_at>NOW())
    UNION ALL SELECT plan_id,status,NULL::timestamptz AS starts_at FROM membership_requests WHERE user_id=$1 AND status='pending'`,[user.id]):{rows:[]};
  const requested=new Set(state.rows.map((row)=>Number(row.plan_id)));
  const hasActiveMembership=state.rows.some((row)=>row.status==="active"&&(!row.starts_at||new Date(row.starts_at).getTime()<=Date.now()));
  return <><PublicHeader/><main className="membership-page"><div className="public-container"><section className="catalog-heading"><span className="eyebrow">GIN MEMBERSHIP</span><h1>سطوح عضویت</h1><p>GIN در سایت مرجع ۱۲ سطح عضویت معرفی می‌کند. ارتقا به هر سطح به احراز شرایط و تأیید کمیته پذیرش عضویت وابسته است.</p></section>{plans.rows.length?<div className="membership-plan-grid">{plans.rows.map((plan)=>{const benefits=Array.isArray(plan.benefits)?plan.benefits as string[]:[];const free=Number(plan.price_minor)===0;return <article className="membership-plan-card" key={plan.id}><div className="membership-plan-icon"><Crown size={22}/></div><span className="eyebrow">LEVEL {plan.level}</span><h2>{plan.name}</h2><p>{plan.description}</p><div className="membership-price">{free?"رایگان":`${Number(plan.price_minor).toLocaleString("fa-IR")} ${plan.currency??""}`}<small>{plan.billing_interval==="month"?"ماهانه":plan.billing_interval==="year"?"سالانه":"بدون پرداخت دوره‌ای"}</small></div><ul>{benefits.map((benefit)=><li key={benefit}><CheckCircle2 size={15}/>{benefit}</li>)}</ul>{free?<MembershipRequestButton planId={Number(plan.id)} authenticated={Boolean(user)} disabled={false} alreadyRequested={requested.has(Number(plan.id))} hasActiveMembership={hasActiveMembership}/>:<div className="membership-payment-pending">درگاه پرداخت هنوز فعال نشده است؛ خرید آنلاین این پلن موقتاً غیرفعال است.</div>}</article>;})}</div>:<section className="membership-reference"><div className="membership-reference-intro"><div><span className="eyebrow">OFFICIAL MEMBERSHIP STRUCTURE</span><h2>ساختار ۱۲ سطحی عضویت</h2><p>در اطلاعات عمومی سایت مرجع، فقط هزینه و مزایای سطح اول منتشر شده و جزئیات سطوح بالاتر پس از احراز شرایط در اختیار اعضا قرار می‌گیرد.</p></div><div className="membership-reference-price"><span>هزینه اعلام‌شده برای Level 1</span><strong>$1,500</strong><small>هزینه اولیه عضویت</small><strong>$150 <small>/ ماه</small></strong><small>حق عضویت ماهانه</small></div></div><div className="membership-reference-table-wrap"><table className="membership-reference-table"><thead><tr><th>سطح</th><th>عنوان</th><th>شرایط و مزایا</th></tr></thead><tbody>{referenceLevels.map(([level,label,english])=><tr key={level}><td><span className="membership-level-number">{String(level).padStart(2,"0")}</span></td><td><strong>{label}</strong><small>{english}</small></td><td>{level===1?"دسترسی به بخش عضویت سطح اول و امکان حضور در رویدادهای GIN با تهیه بلیت":"جزئیات پس از احراز شرایط و تأیید عضویت اعلام می‌شود"}</td></tr>)}</tbody></table></div><p className="membership-reference-note">این مبالغ از صفحه عمومی سایت مرجع نقل شده‌اند؛ همان سایت افزایش قیمت از ۱ ژانویه ۲۰۲۷ را اعلام کرده است. مبلغ نهایی و شرایط جاری باید پیش از پرداخت توسط مدیریت تأیید شود. درگاه پرداخت این پورتال هنوز پیکربندی نشده و در این صفحه خرید آنلاین انجام نمی‌شود.</p><div className="membership-reference-actions"><Link href="/register" className="button">درخواست عضویت</Link><span>برای شروع، درخواست عضویت خود را ثبت کنید تا پس از بررسی با شما تماس گرفته شود.</span></div></section>}{user&&<MemberMembershipControls/>}</div></main><PublicFooter/></>;
}
