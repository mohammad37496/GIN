import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpen, CheckCircle2, Clock3, LockKeyhole } from "lucide-react";
import PublicHeader from "@/components/public-header";
import PublicFooter from "@/components/public-footer";
import CourseEnrollButton from "@/components/course-enroll-button";
import { canManageCourse,getSession } from "@/lib/auth";
import { ensureSchema, pool } from "@/lib/db";
import { syncMembershipState } from "@/lib/membership";

export const dynamic = "force-dynamic";

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  await ensureSchema();
  const { slug } = await params;
  const user = await getSession();
  if(user)await syncMembershipState(user.id);
  const courseResult = await pool.query("SELECT * FROM courses WHERE slug=$1 AND status='published'", [slug]);
  const course = courseResult.rows[0];
  if (!course) notFound();
  const categories=await pool.query("SELECT cc.name,cc.slug FROM course_category_links ccl JOIN course_categories cc ON cc.id=ccl.category_id WHERE ccl.course_id=$1 AND cc.is_active=TRUE ORDER BY cc.position",[course.id]);
  const enrollment = user ? await pool.query("SELECT status FROM course_enrollments WHERE course_id=$1 AND user_id=$2 AND status IN ('active','completed') AND (expires_at IS NULL OR expires_at>NOW())", [course.id, user.id]) : { rows: [] };
  const isEnrolled = enrollment.rows.length > 0;
  const canManage=user?await canManageCourse(user,Number(course.id)):false;
  const sectionsResult = await pool.query(`SELECT s.id,s.title,s.description,s.position,l.id AS lesson_id,l.title AS lesson_title,
    l.summary AS lesson_summary,l.duration_seconds,l.is_preview,l.position AS lesson_position,lp.status AS progress_status
    FROM course_sections s LEFT JOIN lessons l ON l.section_id=s.id AND l.status='published'
    LEFT JOIN lesson_progress lp ON lp.lesson_id=l.id AND lp.user_id=$2
    WHERE s.course_id=$1 ORDER BY s.position,l.position`, [course.id, user?.id ?? null]);
  const sections = new Map<number, { id:number; title:string; description:string; lessons:{id:number;title:string;summary:string;duration:number;preview:boolean;locked:boolean;completed:boolean}[] }>();
  for (const row of sectionsResult.rows) {
    const id = Number(row.id);
    if (!sections.has(id)) sections.set(id, { id, title: row.title, description: row.description, lessons: [] });
    if (row.lesson_id) sections.get(id)!.lessons.push({ id:Number(row.lesson_id), title:row.lesson_title, summary:row.lesson_summary, duration:row.duration_seconds, preview:row.is_preview, locked:!isEnrolled && !canManage && !row.is_preview, completed:row.progress_status === "completed" });
  }
  const lessonCount = [...sections.values()].reduce((sum, section) => sum + section.lessons.length, 0);
  const completedCount = [...sections.values()].reduce((sum, section) => sum + section.lessons.filter((lesson) => lesson.completed).length, 0);
  return <><PublicHeader/><main className="course-detail-page"><div className="public-container"><div className="page-breadcrumb"><Link href="/">خانه</Link><span>/</span><Link href="/courses">دوره‌ها</Link><span>/</span><span>{course.title}</span></div><section className="course-detail-hero"><div><span className="eyebrow">GIN LEARNING COURSE</span><h1>{course.title}</h1><p>{course.summary}</p>{categories.rows.length>0&&<div className="course-category-tags">{categories.rows.map(item=><Link key={item.slug} href={`/courses?category=${item.slug}`}>{item.name}</Link>)}</div>}<div className="course-detail-stats"><span><BookOpen size={16}/> {lessonCount} درس</span><span><Clock3 size={16}/> {course.estimated_minutes ? `${course.estimated_minutes} دقیقه` : "زمان متغیر"}</span></div>{canManage?<Link href="/instructor" className="button button-small">مدیریت محتوای دوره</Link>:<CourseEnrollButton slug={slug} isAuthenticated={Boolean(user)} isEnrolled={isEnrolled} accessType={course.access_type}/>}</div><div className="course-detail-symbol"><span>G</span><small>LEARN · CONNECT · GROW</small></div></section><div className="course-detail-layout"><section className="curriculum"><div className="curriculum-heading"><div><span className="eyebrow">COURSE CONTENT</span><h2>محتوای دوره</h2></div>{isEnrolled && <span className="curriculum-progress"><CheckCircle2 size={15}/> {completedCount} از {lessonCount} درس تکمیل‌شده</span>}</div>{sections.size ? [...sections.values()].map((section,index)=><article className="curriculum-section" key={section.id}><div className="curriculum-section-title"><span>{String(index+1).padStart(2,"0")}</span><div><h3>{section.title}</h3>{section.description && <p>{section.description}</p>}</div></div><div className="curriculum-lessons">{section.lessons.map((lesson)=> <div className="curriculum-lesson" key={lesson.id}>{lesson.locked ? <LockKeyhole size={17}/> : lesson.completed ? <CheckCircle2 size={17} className="lesson-done"/> : <BookOpen size={17}/>}<div><strong>{lesson.title}</strong>{lesson.summary && <small>{lesson.summary}</small>}</div><span>{lesson.duration ? `${Math.ceil(lesson.duration/60)} دقیقه` : lesson.preview ? "پیش‌نمایش" : ""}</span>{lesson.locked ? <span className="lesson-lock-label">قفل</span> : <Link href={`/courses/${slug}/lessons/${lesson.id}`} aria-label={`مشاهده ${lesson.title}`}><ArrowRight size={16}/></Link>}</div>)}</div></article>) : <div className="catalog-empty">محتوای این دوره هنوز اضافه نشده است.</div>}</section><aside className="course-sidebar"><h3>درباره این دوره</h3><p>{course.description || course.summary}</p><div className="sidebar-access"><span>نوع دسترسی</span><strong>{course.access_type === "free" ? "رایگان" : course.access_type === "members" ? "ویژه اعضا" : "نیازمند خرید"}</strong></div><Link href="/faq" className="text-arrow">راهنمای استفاده <ArrowRight size={15}/></Link></aside></div></div></main><PublicFooter/></>;
}
