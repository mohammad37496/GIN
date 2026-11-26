import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ensureSchema, pool } from "@/lib/db";
import { syncMembershipState } from "@/lib/membership";
import { EnglishLogoutButton } from "@/components/english-member-controls";
import { englishContent } from "@/lib/bilingual-content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Member Dashboard", description: "Your GIN learning, membership, events and certificates.", robots: { index: false, follow: false }, alternates: { canonical: "/en/dashboard", languages: { en: "/en/dashboard", fa: "/fa/dashboard" } } };

export default async function EnglishDashboardPage() {
  const user = await getSession();
  if (!user) redirect("/en/login?next=%2Fen%2Fdashboard");
  if (user.role === "admin") redirect("/en/admin");
  await ensureSchema();
  await syncMembershipState(user.id);
  const [courses, memberships, events, certificates, orders, profile, rolesResult] = await Promise.all([
    pool.query(`SELECT c.slug,c.title_en,c.summary_en,e.status,COUNT(DISTINCT l.id)::int AS lesson_count,
      COUNT(DISTINCT CASE WHEN lp.status='completed' THEN l.id END)::int AS completed_count
      FROM course_enrollments e JOIN courses c ON c.id=e.course_id LEFT JOIN course_sections s ON s.course_id=c.id
      LEFT JOIN lessons l ON l.section_id=s.id AND l.status='published' LEFT JOIN lesson_progress lp ON lp.lesson_id=l.id AND lp.user_id=e.user_id
      WHERE e.user_id=$1 AND e.status IN ('active','completed') AND (e.expires_at IS NULL OR e.expires_at>NOW()) AND c.status='published'
      GROUP BY c.id,e.id ORDER BY e.enrolled_at DESC`, [user.id]),
    pool.query(`SELECT m.id,m.status,m.starts_at,m.ends_at,p.name_en AS plan_name_en,p.level FROM memberships m JOIN membership_plans p ON p.id=m.plan_id WHERE m.user_id=$1 ORDER BY m.created_at DESC LIMIT 10`, [user.id]),
    pool.query(`SELECT e.slug,e.title_en,e.starts_at,e.location_en,r.status FROM event_registrations r JOIN events e ON e.id=r.event_id WHERE r.user_id=$1 AND r.status IN ('registered','waitlisted') AND e.ends_at>NOW() ORDER BY e.starts_at LIMIT 10`, [user.id]),
    pool.query(`SELECT ce.public_id,ce.serial_number,ce.issued_at,c.title_en AS course_title_en FROM certificates ce JOIN courses c ON c.id=ce.course_id WHERE ce.user_id=$1 AND ce.revoked_at IS NULL ORDER BY ce.issued_at DESC LIMIT 10`, [user.id]),
    pool.query("SELECT o.public_id,o.status,o.currency,o.total_minor,o.created_at,i.invoice_number FROM orders o LEFT JOIN invoices i ON i.order_id=o.id WHERE o.user_id=$1 ORDER BY o.created_at DESC LIMIT 10", [user.id]),
    pool.query("SELECT display_name FROM user_profiles WHERE user_id=$1", [user.id]),
    pool.query("SELECT role FROM user_roles WHERE user_id=$1", [user.id]),
  ]);
  const roles = new Set(rolesResult.rows.map((row) => String(row.role)));
  if (roles.has("finance") || roles.has("affiliate_manager")) redirect("/en/finance-center");
  if (roles.has("support")) redirect("/en/support-center");
  if (roles.has("event_manager")) redirect("/en/events-manager");
  if (roles.has("instructor")) redirect("/en/instructor");
  const displayName = profile.rows[0]?.display_name || user.username;

  return <article className="gin-en-page gin-en-dashboard">
    <h1>Welcome, {displayName}</h1>
    <p className="gin-en-page-intro">Manage your learning, membership, upcoming events and account details.</p>
    <div className="gin-en-dashboard-links"><Link href="/en/profile">Account Profile</Link><Link href="/en/portal-membership">Portal Membership Plans</Link><Link href="/en/membership-levels">GIN Membership Levels</Link><Link href="/en/courses">Learning Library</Link><Link href="/en/events">Events</Link><Link href="/en/support">Support</Link>{roles.has("affiliate_manager") && <Link href="/en/affiliate">Affiliate Workspace</Link>}<EnglishLogoutButton /></div>
    <section className="gin-en-section"><h2>My Courses</h2>{courses.rows.length ? courses.rows.map((course) => { const percent = course.lesson_count ? Math.round(course.completed_count / course.lesson_count * 100) : 0; return <article className="gin-en-dashboard-row" key={course.slug}><div dir="ltr"><strong><Link href={`/en/courses/${course.slug}`}>{englishContent(course.title_en)}</Link></strong><p>{englishContent(course.summary_en)}</p><small>{course.completed_count} of {course.lesson_count} lessons completed · {percent}%</small></div><Link href={`/en/courses/${course.slug}`} className="gin-en-button gin-en-button-alt">Continue learning</Link></article>; }) : <p>You are not enrolled in a course yet. <Link href="/en/courses">Browse the learning library</Link>.</p>}</section>
    <section className="gin-en-section"><h2>My Memberships</h2>{memberships.rows.length ? memberships.rows.map((item) => <article className="gin-en-dashboard-row" key={item.id}><div dir="ltr"><strong>{englishContent(item.plan_name_en)}</strong><p>Status: {item.status} · Level {item.level}</p></div><span>{item.ends_at ? new Date(item.ends_at).toLocaleDateString("en-US") : "No expiry date"}</span></article>) : <p>No active membership is recorded. <Link href="/en/membership-levels">View membership levels</Link>.</p>}</section>
    <section className="gin-en-section"><h2>My Upcoming Events</h2>{events.rows.length ? events.rows.map((event) => <article className="gin-en-dashboard-row" key={event.slug}><div dir="ltr"><strong><Link href={`/en/events/${event.slug}`}>{englishContent(event.title_en)}</Link></strong><p>{new Date(event.starts_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })} · {englishContent(event.location_en)}</p></div><span>{event.status === "waitlisted" ? "Waitlisted" : "Registered"}</span></article>) : <p>You have no upcoming event registrations. <Link href="/en/events">Browse events</Link>.</p>}</section>
    <section className="gin-en-section"><h2>My Certificates</h2>{certificates.rows.length ? certificates.rows.map((certificate) => <article className="gin-en-dashboard-row" key={certificate.public_id}><div dir="ltr"><strong>{englishContent(certificate.course_title_en)}</strong><p>{certificate.serial_number} · {new Date(certificate.issued_at).toLocaleDateString("en-US")}</p></div><Link href={`/en/certificates/${certificate.public_id}`}>View certificate</Link></article>) : <p>Your certificates will appear here after you complete the required course work and assessments.</p>}</section>
    <section className="gin-en-section"><h2>Orders and Payments</h2>{orders.rows.length ? orders.rows.map((order) => <article className="gin-en-dashboard-row" key={order.public_id}><div><strong>{(Number(order.total_minor) / 100).toLocaleString("en-US", { style: "currency", currency: order.currency || "USD" })}</strong><p>{order.public_id} · {order.invoice_number || "No invoice"}</p></div><span>{order.status}</span></article>) : <p>No orders have been recorded. Online payment is not currently configured.</p>}</section>
  </article>;
}
