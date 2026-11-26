import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession, canManageCourse } from "@/lib/auth";
import { ensureSchema, pool } from "@/lib/db";
import { syncMembershipState } from "@/lib/membership";
import { EnglishLessonProgressButton, EnglishLessonResources } from "@/components/english-lesson-controls";
import { englishContent } from "@/lib/bilingual-content";
import { buildLessonMetadata, hasUsableLessonTranslation } from "@/lib/lesson-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string; lessonId: string }> }): Promise<Metadata> {
  await ensureSchema();
  const { slug, lessonId: rawLessonId } = await params;
  const lessonId = Number(rawLessonId);
  if (!Number.isSafeInteger(lessonId) || lessonId < 1) {
    return buildLessonMetadata({ locale: "en", slug, lessonId: 0, title: null, isPreview: false });
  }
  const result = await pool.query(`SELECT l.title_en,l.summary_en,l.content_en,l.title,l.content,l.is_preview
    FROM lessons l JOIN course_sections s ON s.id=l.section_id JOIN courses c ON c.id=s.course_id
    WHERE l.id=$1 AND c.slug=$2 AND l.status='published' AND c.status='published'`, [lessonId, slug]);
  const lesson = result.rows[0];
  if (!lesson) return { title: "Lesson not found | GIN", robots: { index: false, follow: false } };
  return buildLessonMetadata({ locale: "en", slug, lessonId, title: lesson.title_en, summary: lesson.summary_en, isPreview: lesson.is_preview === true, hasTranslation: Boolean(lesson.title_en?.trim() && lesson.content_en?.trim()), hasCounterpartTranslation: hasUsableLessonTranslation(lesson.title, lesson.content) });
}

export default async function EnglishLessonPage({ params }: { params: Promise<{ slug: string; lessonId: string }> }) {
  await ensureSchema();
  const { slug, lessonId: rawLessonId } = await params;
  const lessonId = Number(rawLessonId);
  if (!Number.isSafeInteger(lessonId) || lessonId < 1) notFound();
  const user = await getSession();
  if (user) await syncMembershipState(user.id);
  const result = await pool.query(`SELECT l.id,l.title_en,l.summary_en,l.content_en,l.video_url,l.duration_seconds,l.is_preview,
    c.id AS course_id,c.slug AS course_slug,c.title_en AS course_title_en,lp.status AS progress_status
    FROM lessons l JOIN course_sections s ON s.id=l.section_id JOIN courses c ON c.id=s.course_id
    LEFT JOIN lesson_progress lp ON lp.lesson_id=l.id AND lp.user_id=$3
    WHERE l.id=$1 AND c.slug=$2 AND l.status='published' AND c.status='published'`, [lessonId, slug, user?.id ?? null]);
  const lesson = result.rows[0];
  if (!lesson) notFound();
  const enrollment = user ? await pool.query(`SELECT 1 FROM course_enrollments WHERE course_id=$1 AND user_id=$2 AND status IN ('active','completed') AND (expires_at IS NULL OR expires_at>NOW())`, [lesson.course_id, user.id]) : { rows: [] };
  const enrolled = enrollment.rows.length > 0;
  const canManage = user ? await canManageCourse(user, Number(lesson.course_id)) : false;
  if (!enrolled && !canManage && !lesson.is_preview) {
    if (!user) redirect(`/en/login?next=${encodeURIComponent(`/en/courses/${slug}/lessons/${lessonId}`)}`);
    redirect(`/en/courses/${slug}`);
  }
  let safeVideoUrl: string | null = null;
  if (typeof lesson.video_url === "string") {
    try { const parsed = new URL(lesson.video_url); if (parsed.protocol === "https:") safeVideoUrl = parsed.toString(); } catch { /* Invalid media URLs are omitted. */ }
  }

  return <article className="gin-en-page">
    <div className="gin-en-breadcrumb"><Link href="/en">Home</Link> / <Link href="/en/courses">Learning Library</Link> / <Link href={`/en/courses/${slug}`}>{englishContent(lesson.course_title_en)}</Link></div>
    <Link href={`/en/courses/${slug}`}>← Back to course curriculum</Link>
    <h1 dir="ltr">{englishContent(lesson.title_en)}</h1>
    <p dir="ltr" className="gin-en-page-intro">{englishContent(lesson.summary_en)}</p>
    {safeVideoUrl ? <video className="gin-en-lesson-video" controls preload="metadata" src={safeVideoUrl}>Your browser does not support video playback.</video> : <div className="gin-en-section"><p>Lesson video is not available. Review the lesson content below.</p></div>}
    <section className="gin-en-section gin-en-lesson-body" dir="ltr">{String(englishContent(lesson.content_en)).split(/\r?\n\s*\r?\n/).map((paragraph: string, index: number) => <p key={index}>{paragraph}</p>)}</section>
    {enrolled ? <EnglishLessonProgressButton lessonId={lessonId} durationSeconds={Number(lesson.duration_seconds || 0)} completed={lesson.progress_status === "completed"} /> : canManage ? <p>Instructor access: lesson progress is not recorded for course managers.</p> : <p className="gin-en-form-success">You are viewing a lesson preview. Enroll in the course to track your progress.</p>}
    <EnglishLessonResources lessonId={lessonId} />
  </article>;
}
