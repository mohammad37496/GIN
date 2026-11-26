import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays,MapPin,Users } from "lucide-react";
import PublicHeader from "@/components/public-header";
import PublicFooter from "@/components/public-footer";
import EventRegistrationButton from "@/components/event-registration-button";
import { getSession } from "@/lib/auth";
import { ensureSchema,pool } from "@/lib/db";
import JsonLd from "@/components/json-ld";
import { buildBreadcrumbSchema, buildEventSchema } from "@/lib/structured-data";

export const dynamic="force-dynamic";

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  await ensureSchema();
  const {slug}=await params;
  const result=await pool.query("SELECT title,summary,description FROM events WHERE slug=$1 AND status='published'",[slug]);
  const event=result.rows[0];
  const title=event?.title??"رویدادهای GIN";
  const description=event?.summary||event?.description||"رویدادها و گردهمایی‌های شبکه جهانی اطلاعات.";
  const url=`/fa/events/${slug}`;
  return {title,description,alternates:{canonical:url,languages:{fa:url,en:`/en/events/${slug}`}},openGraph:{title,description,url,siteName:"Global Information Network",type:"article",images:[{url:"/gin/gin-social-card.png",width:1200,height:630,alt:title}]},twitter:{card:"summary_large_image",title,description,images:["/gin/gin-social-card.png"]}};
}

export default async function EventPage({params}:{params:Promise<{slug:string}>}){await ensureSchema();const {slug}=await params;const user=await getSession();const result=await pool.query(`SELECT e.id,e.slug,e.title,e.summary,e.description,e.location,e.starts_at,e.ends_at,e.capacity,e.access_type,
  CASE WHEN EXISTS(SELECT 1 FROM event_registrations r WHERE r.event_id=e.id AND r.user_id=$2 AND r.status='registered') THEN e.meeting_url ELSE NULL END AS meeting_url,
  COUNT(reg.id) FILTER(WHERE reg.status='registered')::int AS registered_count,
  (SELECT r.status FROM event_registrations r WHERE r.event_id=e.id AND r.user_id=$2) AS my_status
  FROM events e LEFT JOIN event_registrations reg ON reg.event_id=e.id WHERE e.slug=$1 AND e.status='published' GROUP BY e.id`,[slug,user?.id??null]);const event=result.rows[0];if(!event)notFound();
  const eventSchema=buildEventSchema({title:event.title,summary:event.summary,path:`/events/${slug}`,startsAt:event.starts_at,endsAt:event.ends_at,location:event.location});
  const breadcrumbSchema=buildBreadcrumbSchema([{name:"خانه",path:"/"},{name:"رویدادها",path:"/events"},{name:event.title,path:`/events/${slug}`}]);
  return <><JsonLd data={[eventSchema,breadcrumbSchema]}/><PublicHeader/><main className="event-detail-page"><div className="public-container"><div className="page-breadcrumb"><Link href="/">خانه</Link><span>/</span><Link href="/events">رویدادها</Link><span>/</span><span>{event.title}</span></div><section className="event-detail-card"><span className="eyebrow">GIN COMMUNITY EVENT</span><h1>{event.title}</h1><p>{event.summary}</p><div className="event-meta"><span><CalendarDays size={16}/>{new Date(event.starts_at).toLocaleString("fa-IR")}</span><span><MapPin size={16}/>{event.location||"محل برگزاری در اطلاعیه"}</span><span><Users size={16}/>{event.capacity===null?"ظرفیت آزاد":`${event.registered_count} از ${event.capacity} نفر ثبت‌نام کرده‌اند`}</span></div><div className="event-description">{event.description.split(/\r?\n\s*\r?\n/).map((part:string,index:number)=><p key={index}>{part}</p>)}</div>{event.meeting_url&&<p><a href={event.meeting_url} rel="noreferrer" target="_blank">ورود به جلسه آنلاین</a></p>}<EventRegistrationButton slug={slug} authenticated={Boolean(user)} status={event.my_status} accessType={event.access_type}/></section></div></main><PublicFooter/></>}
