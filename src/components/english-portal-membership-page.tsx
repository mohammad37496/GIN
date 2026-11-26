import Link from "next/link";
import { getSession } from "@/lib/auth";
import { ensureSchema, pool } from "@/lib/db";
import { syncMembershipState } from "@/lib/membership";
import EnglishMembershipRequestButton from "@/components/english-membership-request-button";
import { englishContent } from "@/lib/bilingual-content";

export default async function EnglishPortalMembershipPage() {
  try {
    await ensureSchema();
    const user = await getSession();
    if (user) await syncMembershipState(user.id);
    const plans = await pool.query("SELECT id,name_en,description_en,level,price_minor,currency,billing_interval,benefits_en FROM membership_plans WHERE is_active=TRUE ORDER BY level,id");
    const state = user ? await pool.query(`SELECT plan_id,status,starts_at FROM memberships WHERE user_id=$1 AND status IN ('active','pending') AND (ends_at IS NULL OR ends_at>NOW()) UNION ALL SELECT plan_id,status,NULL::timestamptz AS starts_at FROM membership_requests WHERE user_id=$1 AND status='pending'`, [user.id]) : { rows: [] };
    const requested = new Set(state.rows.map((row) => Number(row.plan_id)));
    const hasActiveMembership = state.rows.some((row) => row.status === "active" && (!row.starts_at || new Date(row.starts_at).getTime() <= Date.now()));

    return <article className="gin-en-page gin-en-portal-membership">
      <div className="gin-en-breadcrumb"><Link href="/en">Home</Link> / Portal Membership</div>
      <h1>Portal Membership Plans</h1>
      <p className="gin-en-page-intro">These plans belong to this learning portal and are separate from official Global Information Network membership. Official GIN membership applications, fees and acceptance are handled by GIN through its own application website.</p>
      {plans.rows.length ? <div className="gin-en-course-grid">{plans.rows.map((plan) => {
        const benefits = Array.isArray(plan.benefits_en) ? plan.benefits_en as string[] : [];
        const free = Number(plan.price_minor) === 0;
        return <section className="gin-en-section" key={plan.id}>
          <span className="gin-en-course-kicker">PORTAL LEVEL {plan.level}</span><h2 dir="ltr">{englishContent(plan.name_en)}</h2><p dir="ltr">{englishContent(plan.description_en)}</p>
          <p className="gin-en-plan-price">{free ? "Free" : `${Number(plan.price_minor).toLocaleString("en-US")} ${plan.currency ?? ""}`} <small>{plan.billing_interval === "month" ? "per month" : plan.billing_interval === "year" ? "per year" : "no recurring payment"}</small></p>
          {benefits.length > 0 ? <ul dir="ltr">{benefits.map((benefit) => <li key={benefit}>{englishContent(benefit)}</li>)}</ul> : <p dir="ltr">{englishContent(null)}</p>}
          {free ? <EnglishMembershipRequestButton planId={Number(plan.id)} authenticated={Boolean(user)} alreadyRequested={requested.has(Number(plan.id))} hasActiveMembership={hasActiveMembership} /> : <p className="gin-en-form-error">Online payment is not configured. No payment will be collected for this plan.</p>}
        </section>;
      })}</div> : <p>No portal plans are currently published.</p>}
    </article>;
  } catch {
    return <article className="gin-en-page gin-en-portal-membership"><h1>Portal Membership Plans</h1><p className="gin-en-form-error">Portal membership data is temporarily unavailable. No application or payment has been submitted.</p></article>;
  }
}
