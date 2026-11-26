import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, BookOpen, LockKeyhole } from "lucide-react";
import PublicHeader from "@/components/public-header";
import PublicFooter from "@/components/public-footer";
import LessonProgressButton from "@/components/lesson-progress-button";
import LessonResources from "@/components/lesson-resources";
import { canManageCourse,getSession } from "@/lib/auth";
import { ensureSchema, pool } from "@/lib/db";
import { syncMembershipState } from "@/lib/membership";

export const dynamic = "force-dynamic";

export default async function LessonPage({ params }: { params: Promise<{ slug: string; lessonId: string }> }) {
  await ensureSchema();
  const { slug, lessonId: rawLessonId } = await params;
  const lessonId = Number(rawLessonId);
  if (!Number.isSafeInteger(lessonId) || lessonId < 1) notFound();
  const user = await getSession();
  if(user)await syncMembershipState(user.id);
  const result = await pool.query(`SELECT l.id,l.title,l.summary,l.content,l.video_url,l.duration_seconds,l.is_preview,
    c.id AS course_id,c.slug AS course_slug,c.title AS course_title,
    lp.status AS progress_status
    FROM lessons l JOIN course_sections s ON s.id=l.section_id JOIN courses c ON c.id=s.course_id
    LEFT JOIN lesson_progress lp ON lp.lesson_id=l.id AND lp.user_id=$3
    WHERE l.id=$1 AND c.slug=$2 AND l.status='published' AND c.status='published'`, [lessonId, slug, user?.id ?? null]);
  const lesson = result.rows[0];
  if (!lesson) notFound();
  const enrollment = user ? await pool.query(`SELECT 1 FROM course_enrollments WHERE course_id=$1 AND user_id=$2
    AND status IN ('active','completed') AND (expires_at IS NULL OR expires_at>NOW())`, [lesson.course_id, user.id]) : { rows: [] };
  const isEnrolled = enrollment.rows.length > 0;
  const canManage=user?await canManageCourse(user,Number(lesson.course_id)):false;
  if (!isEnrolled && !canManage && !lesson.is_preview) {
    if (!user) redirect(`/login?next=${encodeURIComponent(`/courses/${slug}/lessons/${lessonId}`)}`);
    redirect(`/courses/${slug}`);
  }
  let safeVideoUrl: string | null = null;
  if (typeof lesson.video_url === "string") {
    try { const parsed = new URL(lesson.video_url); if (parsed.protocol === "https:") safeVideoUrl = parsed.toString(); } catch { /* Ignore invalid media URLs. */ }
  }
  return <><PublicHeader/><main className="lesson-page"><div className="public-container"><div className="page-breadcrumb"><Link href="/">خانه</Link><span>/</span><Link href="/courses">دوره‌ها</Link><span>/</span><Link href={`/courses/${slug}`}>{lesson.course_title}</Link></div><Link href={`/courses/${slug}`} className="lesson-back"><ArrowRight size={16}/> بازگشت به محتوای دوره</Link><article className="lesson-content-card"><span className="eyebrow">GIN LESSON</span><h1>{lesson.title}</h1>{lesson.summary && <p className="lesson-summary">{lesson.summary}</p>}{safeVideoUrl ? <video className="lesson-video" controls preload="metadata" src={safeVideoUrl}>مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.</video> : <div className="lesson-video-placeholder"><BookOpen size={34}/><span>محتوای آموزشی این درس</span></div>}<div className="lesson-body">{lesson.content ? lesson.content.split(/\r?\n\s*\r?\n/).map((paragraph:string,index:number)=><p key={index}>{paragraph}</p>) : <p className="muted">محتوای متنی این درس هنوز منتشر نشده است.</p>}</div>{isEnrolled ? <LessonProgressButton lessonId={lessonId} durationSeconds={lesson.duration_seconds} completed={lesson.progress_status === "completed"}/> : canManage?<div className="lesson-preview-note">دسترسی مدیریت محتوا؛ پیشرفت یادگیری برای حساب مدرس ثبت نمی‌شود.</div>:<div className="lesson-preview-note"><LockKeyhole size={16}/> شما در حال مشاهده پیش‌نمایش این درس هستید؛ برای ثبت پیشرفت در دوره ثبت‌نام کنید.</div>}</article><LessonResources lessonId={lessonId}/></div></main><PublicFooter/></>;
}
