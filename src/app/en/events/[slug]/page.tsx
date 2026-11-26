import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ensureSchema, pool } from "@/lib/db";
import EnglishEventRegistrationButton from "@/components/english-event-registration-button";
import { englishContent } from "@/lib/bilingual-content";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: `${slug.replaceAll("-", " ")} | GIN Events`, alternates: { canonical: `/en/events/${slug}`, languages: { en: `/en/events/${slug}`, fa: `/fa/events/${slug}` } } };
}

export default async function EnglishEventPage({ params }: { params: Promise<{ slug: string }> }) {
  await ensureSchema();
  const { slug } = await params;
  const user = await getSession();
  const result = await pool.query(`SELECT e.id,e.slug,e.title_en,e.summary_en,e.description_en,e.location_en,e.starts_at,e.ends_at,e.capacity,e.access_type,
    CASE WHEN EXISTS(SELECT 1 FROM event_registrations mine WHERE mine.event_id=e.id AND mine.user_id=$2 AND mine.status='registered') THEN e.meeting_url ELSE NULL END AS meeting_url,
    COUNT(reg.id) FILTER(WHERE reg.status='registered')::int AS registered_count,
    (SELECT r.status FROM event_registrations r WHERE r.event_id=e.id AND r.user_id=$2) AS my_status
    FROM events e LEFT JOIN event_registrations reg ON reg.event_id=e.id
    WHERE e.slug=$1 AND e.status='published' GROUP BY e.id`, [slug, user?.id ?? null]);
  const event = result.rows[0];
  if (!event) notFound();

  return <article className="gin-en-page">
    <div className="gin-en-breadcrumb"><Link href="/en">Home</Link> / <Link href="/en/events">GIN Events</Link> / {englishContent(event.title_en)}</div>
    <h1 dir="ltr">{englishContent(event.title_en)}</h1>
    <p dir="ltr" className="gin-en-page-intro">{englishContent(event.summary_en)}</p>
    <section className="gin-en-section">
      <h2>Event details</h2>
      <div className="gin-en-event-meta"><span>{new Date(event.starts_at).toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })}</span><span dir="ltr">{englishContent(event.location_en)}</span><span>{event.capacity === null ? "Open capacity" : `${event.registered_count} of ${event.capacity} registered`}</span></div>
      <div dir="ltr">{String(englishContent(event.description_en)).split(/\r?\n\s*\r?\n/).map((paragraph: string, index: number) => <p key={index}>{paragraph}</p>)}</div>
      {event.meeting_url && <p><a href={event.meeting_url} target="_blank" rel="noreferrer">Join the online event</a></p>}
      <EnglishEventRegistrationButton slug={slug} authenticated={Boolean(user)} status={event.my_status} accessType={event.access_type} />
    </section>
  </article>;
}
