import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession, canManageCourse } from "@/lib/auth";
import { ensureSchema, pool } from "@/lib/db";
import { syncMembershipState } from "@/lib/membership";
import EnglishCourseEnrollButton from "@/components/english-course-enroll-button";
import { englishContent } from "@/lib/bilingual-content";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: `${slug.replaceAll("-", " ")} | GIN Learning Library`, alternates: { canonical: `/en/courses/${slug}`, languages: { en: `/en/courses/${slug}`, fa: `/fa/courses/${slug}` } } };
}

export default async function EnglishCoursePage({ params }: { params: Promise<{ slug: string }> }) {
  await ensureSchema();
  const { slug } = await params;
  const user = await getSession();
  if (user) await syncMembershipState(user.id);
  const courseResult = await pool.query("SELECT * FROM courses WHERE slug=$1 AND status='published'", [slug]);
  const course = courseResult.rows[0];
  if (!course) notFound();
  const [categories, enrollment, sectionsResult] = await Promise.all([
    pool.query("SELECT cc.name_en,cc.slug FROM course_category_links ccl JOIN course_categories cc ON cc.id=ccl.category_id WHERE ccl.course_id=$1 AND cc.is_active=TRUE ORDER BY cc.position", [course.id]),
    user ? pool.query("SELECT status FROM course_enrollments WHERE course_id=$1 AND user_id=$2 AND status IN ('active','completed') AND (expires_at IS NULL OR expires_at>NOW())", [course.id, user.id]) : Promise.resolve({ rows: [] }),
    pool.query(`SELECT s.id,s.title_en,s.description_en,s.position,l.id AS lesson_id,l.title_en AS lesson_title_en,
      l.summary_en AS lesson_summary_en,l.duration_seconds,l.is_preview,lp.status AS progress_status
      FROM course_sections s LEFT JOIN lessons l ON l.section_id=s.id AND l.status='published'
      LEFT JOIN lesson_progress lp ON lp.lesson_id=l.id AND lp.user_id=$2
      WHERE s.course_id=$1 ORDER BY s.position,l.position`, [course.id, user?.id ?? null]),
  ]);
  const enrolled = enrollment.rows.length > 0;
  const canManage = user ? await canManageCourse(user, Number(course.id)) : false;
  const sections = new Map<number, { id: number; title: string | null; description: string | null; lessons: { id: number; title: string | null; summary: string | null; duration: number; preview: boolean; locked: boolean; completed: boolean }[] }>();
  for (const row of sectionsResult.rows) {
    const id = Number(row.id);
    if (!sections.has(id)) sections.set(id, { id, title: row.title_en, description: row.description_en, lessons: [] });
    if (row.lesson_id) sections.get(id)!.lessons.push({ id: Number(row.lesson_id), title: row.lesson_title_en, summary: row.lesson_summary_en, duration: row.duration_seconds, preview: row.is_preview, locked: !enrolled && !canManage && !row.is_preview, completed: row.progress_status === "completed" });
  }
  const lessonCount = [...sections.values()].reduce((sum, section) => sum + section.lessons.length, 0);

  return <article className="gin-en-page">
    <div className="gin-en-breadcrumb"><Link href="/en">Home</Link> / <Link href="/en/courses">Learning Library</Link> / {englishContent(course.title_en)}</div>
    <h1 dir="ltr">{englishContent(course.title_en)}</h1>
    <p dir="ltr" className="gin-en-page-intro">{englishContent(course.summary_en)}</p>
    <section className="gin-en-section"><h2>About this course</h2><p dir="ltr">{englishContent(course.description_en)}</p><div className="gin-en-event-meta"><span>{lessonCount} lessons</span><span>{course.estimated_minutes ? `${course.estimated_minutes} minutes` : "Flexible duration"}</span><span>{course.access_type === "free" ? "Free access" : course.access_type === "members" ? "Member access" : "Paid access"}</span></div>{categories.rows.length > 0 && <p dir="ltr">{categories.rows.map((item) => englishContent(item.name_en)).join(" · ")}</p>}{canManage ? <p>Course management access is available in your instructor workspace.</p> : <EnglishCourseEnrollButton slug={slug} authenticated={Boolean(user)} enrolled={enrolled} accessType={course.access_type} />}</section>
    <section className="gin-en-section"><h2>Course Curriculum</h2>{sections.size ? [...sections.values()].map((section, index) => <section className="gin-en-course-section" key={section.id}><h3 dir="ltr">{String(index + 1).padStart(2, "0")} · {englishContent(section.title)}</h3><p dir="ltr">{englishContent(section.description)}</p>{section.lessons.map((lesson) => <div className="gin-en-lesson-row" key={lesson.id}><span>{lesson.locked ? "Locked" : lesson.completed ? "Completed" : lesson.preview ? "Preview" : "Lesson"}</span><div dir="ltr"><strong>{englishContent(lesson.title)}</strong><small>{englishContent(lesson.summary)}</small></div><span>{lesson.duration ? `${Math.ceil(lesson.duration / 60)} min` : ""}</span>{lesson.locked ? <span aria-label="Locked">🔒</span> : <Link href={`/en/courses/${slug}/lessons/${lesson.id}`}>Open lesson</Link>}</div>)}</section>) : <p>Course lessons have not been published yet.</p>}</section>
  </article>;
}
