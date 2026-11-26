import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { ensureSchema, pool } from "@/lib/db";
import { englishContent } from "@/lib/bilingual-content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "GIN Events Calendar", description: "Explore published events and member experiences from the Global Information Network.", alternates: { canonical: "/en/events", languages: { en: "/en/events", fa: "/fa/events" } } };

export default async function EnglishEventsPage() {
  let events: Record<string, unknown>[] = [];
  let unavailable = false;
  try {
    await ensureSchema();
    const user = await getSession();
    const result = await pool.query(`SELECT e.slug,e.title_en,e.summary_en,e.location_en,e.starts_at,e.ends_at,e.capacity,e.access_type,
      COUNT(r.id) FILTER(WHERE r.status='registered')::int AS registered_count,
      EXISTS(SELECT 1 FROM event_registrations mine WHERE mine.event_id=e.id AND mine.user_id=$1 AND mine.status IN ('registered','attended')) AS is_registered
      FROM events e LEFT JOIN event_registrations r ON r.event_id=e.id
      WHERE e.status='published' AND e.ends_at>NOW() GROUP BY e.id ORDER BY e.starts_at LIMIT 40`, [user?.id ?? null]);
    events = result.rows;
  } catch {
    unavailable = true;
  }

  return <article className="gin-en-page">
    <div className="gin-en-breadcrumb"><Link href="/en">Home</Link> / GIN Events</div>
    <h1>GIN Events</h1>
    <p className="gin-en-page-intro">Discover upcoming portal events and learn about the official GIN event program, including major weekend gatherings, seminars, awards rallies, workshops and local chapter meetings.</p>
    <section className="gin-en-section"><h2>Upcoming Portal Events</h2>
      {unavailable ? <p>The portal event calendar is temporarily unavailable. Please check again later or use the official event calendar.</p> : events.length ? <div className="gin-en-event-list">{events.map((event) => <article className="gin-en-event-card" key={String(event.slug)}><h2 dir="ltr"><Link href={`/en/events/${event.slug}`}>{englishContent(event.title_en)}</Link></h2><p dir="ltr">{englishContent(event.summary_en)}</p><div className="gin-en-event-meta"><span>{new Date(String(event.starts_at)).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</span><span dir="ltr">{englishContent(event.location_en)}</span><span>{event.capacity === null ? "Open capacity" : `${Math.max(0, Number(event.capacity) - Number(event.registered_count))} seats remaining`}</span>{event.is_registered === true && <span>Registered</span>}</div><Link className="gin-en-button gin-en-button-alt" href={`/en/events/${event.slug}`}>View event</Link></article>)}</div> : <p>No upcoming portal events have been published. The official GIN event calendar may contain additional member events and announcements.</p>}
    </section>
    <section className="gin-en-section"><h2>Our Events Program</h2><p>The official GIN events page describes the learning formats, subjects and experiences offered to members.</p><div className="gin-en-cta"><Link className="gin-en-button gin-en-button-alt" href="/en/our-events">Read About Our Events</Link><a className="gin-en-button" href="https://globalinformationnetwork.com/events/" target="_blank" rel="noreferrer">Official GIN Events Calendar</a></div></section>
  </article>;
}
