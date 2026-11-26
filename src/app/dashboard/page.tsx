import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Award,BookOpen,CalendarDays,ChevronLeft,Crown,LogOut,UserRound,Receipt } from "lucide-react";
import { getSession } from "@/lib/auth";
import { ensureSchema,pool } from "@/lib/db";
import PublicHeader from "@/components/public-header";
import PublicFooter from "@/components/public-footer";
import MemberNotifications from "@/components/member-notifications";
import { syncMembershipState } from "@/lib/membership";

export const dynamic="force-dynamic";
export const metadata: Metadata = { title: "داشبورد اعضا", robots: { index: false, follow: false }, alternates: { canonical: "/fa/dashboard", languages: { fa: "/fa/dashboard", en: "/en/dashboard" } } };

export default async function Dashboard(){
  const user=await getSession();if(!user)redirect("/login");if(user.role==="admin")redirect("/admin");await ensureSchema();await syncMembershipState(user.id);
  const [courses,memberships,events,certificates,orders,profile,staffRoles]=await Promise.all([
    pool.query(`SELECT c.id,c.slug,c.title,c.summary,e.status,COUNT(DISTINCT l.id)::int AS lesson_count,
      COUNT(DISTINCT CASE WHEN lp.status='completed' THEN l.id END)::int AS completed_count
      FROM course_enrollments e JOIN courses c ON c.id=e.course_id LEFT JOIN course_sections s ON s.course_id=c.id
      LEFT JOIN lessons l ON l.section_id=s.id AND l.status='published' LEFT JOIN lesson_progress lp ON lp.lesson_id=l.id AND lp.user_id=e.user_id
      WHERE e.user_id=$1 AND e.status IN ('active','completed') AND (e.expires_at IS NULL OR e.expires_at>NOW()) AND c.status='published'
      GROUP BY c.id,e.id ORDER BY e.enrolled_at DESC`,[user.id]),
    pool.query(`SELECT m.id,m.status,m.starts_at,m.ends_at,p.name AS plan_name,p.level FROM memberships m JOIN membership_plans p ON p.id=m.plan_id
      WHERE m.user_id=$1 ORDER BY m.created_at DESC LIMIT 10`,[user.id]),
    pool.query(`SELECT e.id,e.slug,e.title,e.starts_at,e.location,r.status FROM event_registrations r JOIN events e ON e.id=r.event_id
      WHERE r.user_id=$1 AND r.status IN ('registered','waitlisted') AND e.ends_at>NOW() ORDER BY e.starts_at LIMIT 10`,[user.id]),
    pool.query(`SELECT ce.public_id,ce.serial_number,ce.issued_at,c.title AS course_title FROM certificates ce JOIN courses c ON c.id=ce.course_id
      WHERE ce.user_id=$1 AND ce.revoked_at IS NULL ORDER BY ce.issued_at DESC LIMIT 10`,[user.id]),
    pool.query(`SELECT o.public_id,o.status,o.currency,o.total_minor,o.created_at,i.invoice_number FROM orders o LEFT JOIN invoices i ON i.order_id=o.id
      WHERE o.user_id=$1 ORDER BY o.created_at DESC LIMIT 10`,[user.id]),
    pool.query("SELECT display_name FROM user_profiles WHERE user_id=$1",[user.id]),
    pool.query("SELECT role FROM user_roles WHERE user_id=$1",[user.id]),
  ]);
  const displayName=profile.rows[0]?.display_name||user.username;
  const roles=new Set(staffRoles.rows.map((item)=>String(item.role)));
  const hasFinanceWorkspace=roles.has("finance")||roles.has("affiliate_manager");
  return <><PublicHeader/><main className="member-dashboard"><div className="public-container"><section className="member-welcome"><div><span className="eyebrow">MEMBER SPACE</span><h1>خوش آمدی، {displayName}</h1><p>مسیر یادگیری، عضویت و رویدادهای خود را از این داشبورد دنبال کنید.</p></div><div className="member-quick-links"><Link href="/profile"><UserRound size={16}/> پروفایل</Link><Link href="/membership"><Crown size={16}/> عضویت</Link><Link href="/courses"><BookOpen size={16}/> دوره‌ها</Link><Link href="/affiliate">همکاری در فروش</Link><Link href="/support">پشتیبانی</Link>{roles.has("instructor")&&<Link href="/instructor">فضای مدرس</Link>}{roles.has("event_manager")&&<Link href="/events-manager">مدیریت رویدادها</Link>}{roles.has("support")&&<Link href="/support-center">مرکز پشتیبانی</Link>}{hasFinanceWorkspace&&<Link href="/finance-center">مرکز مالی</Link>}<form action="/api/auth/logout" method="post"><button><LogOut size={15}/> خروج</button></form></div></section>
    <section className="dashboard-section"><div className="dashboard-section-heading"><div><span className="eyebrow">MY LEARNING</span><h2>دوره‌های من</h2></div><Link href="/courses">مشاهده همه دوره‌ها ←</Link></div>{courses.rows.length?<div className="member-course-list">{courses.rows.map((course)=>{const percent=course.lesson_count?Math.round(course.completed_count/course.lesson_count*100):0;return <article className="member-course-card" key={course.id}><div><span className="eyebrow">{course.status==='completed'?"COMPLETED":"IN PROGRESS"}</span><h3><Link href={`/courses/${course.slug}`}>{course.title}</Link></h3><p>{course.summary}</p><div className="course-progress-track"><span style={{width:`${percent}%`}}/></div><small>{course.completed_count} از {course.lesson_count} درس · {percent}٪ تکمیل‌شده</small></div><Link href={`/courses/${course.slug}`} className="button button-small">ادامه یادگیری</Link></article>})}</div>:<div className="dashboard-empty"><BookOpen size={26}/><p>هنوز در دوره‌ای ثبت‌نام نکرده‌اید.</p><Link href="/courses" className="text-arrow">مشاهده کتابخانه دوره‌ها ←</Link></div>}</section>
    <div className="dashboard-two-columns"><section className="dashboard-section"><div className="dashboard-section-heading"><div><span className="eyebrow">MEMBERSHIP</span><h2>عضویت من</h2></div><Link href="/membership">پلن‌ها ←</Link></div>{memberships.rows.length?memberships.rows.map((item)=><article className="dashboard-list-item" key={item.id}><Crown size={17}/><div><strong>{item.plan_name}</strong><small>{item.status} · سطح {item.level}</small></div><span>{item.ends_at?new Date(item.ends_at).toLocaleDateString("fa-IR"):"بدون انقضا"}</span></article>):<div className="dashboard-empty">عضویت فعالی ثبت نشده است. <Link href="/membership">مشاهده سطوح عضویت</Link></div>}</section>
    <section className="dashboard-section"><div className="dashboard-section-heading"><div><span className="eyebrow">UPCOMING</span><h2>رویدادهای من</h2></div><Link href="/events">تقویم رویدادها ←</Link></div>{events.rows.length?events.rows.map((event)=><article className="dashboard-list-item" key={event.id}><CalendarDays size={17}/><div><strong><Link href={`/events/${event.slug}`}>{event.title}</Link></strong><small>{new Date(event.starts_at).toLocaleString("fa-IR")}</small></div><span>{event.status==='waitlisted'?"فهرست انتظار":"ثبت‌نام‌شده"}</span></article>):<div className="dashboard-empty">رویداد آینده‌ای برای شما ثبت نشده است. <Link href="/events">مشاهده رویدادها</Link></div>}</section></div>
    <section className="dashboard-section"><div className="dashboard-section-heading"><div><span className="eyebrow">CERTIFICATES</span><h2>گواهی‌های من</h2></div></div>{certificates.rows.length?<div className="certificate-list">{certificates.rows.map((certificate)=><article className="dashboard-list-item" key={certificate.public_id}><Award size={17}/><div><strong>{certificate.course_title}</strong><small dir="ltr">{certificate.serial_number}</small></div><Link href={`/certificates/${certificate.public_id}`}>مشاهده گواهی <ChevronLeft size={14}/></Link></article>)}</div>:<div className="dashboard-empty">پس از تکمیل دوره و آزمون‌های الزامی، گواهی شما اینجا نمایش داده می‌شود.</div>}</section>
    <section className="dashboard-section"><div className="dashboard-section-heading"><div><span className="eyebrow">ORDERS</span><h2>سفارش‌ها و پرداخت‌ها</h2></div></div>{orders.rows.length?orders.rows.map((order)=><article className="dashboard-list-item" key={order.public_id}><Receipt size={17}/><div><strong>{Number(order.total_minor).toLocaleString("fa-IR")} {order.currency}</strong><small dir="ltr">{order.public_id} · {order.invoice_number||"بدون فاکتور"}</small></div><span>{order.status}</span></article>):<div className="dashboard-empty">سفارشی ثبت نشده است. درگاه پرداخت هنوز فعال نشده است.</div>}</section>
    <MemberNotifications/>
    </div></main><PublicFooter/></>;
}
