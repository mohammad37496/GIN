import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AssessmentAttempt from "@/components/assessment-attempt";
import { getSession } from "@/lib/auth";
import { ensureSchema, pool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string; assessmentId: string }> }): Promise<Metadata> {
  const { slug, assessmentId } = await params;
  const canonical = `/en/courses/${slug}/assessments/${assessmentId}`;
  return { title: "Course Assessment", robots: { index: false, follow: false }, alternates: { canonical, languages: { en: canonical, fa: `/fa/courses/${slug}/assessments/${assessmentId}` } } };
}

export default async function EnglishAssessmentPage({ params }: { params: Promise<{ slug: string; assessmentId: string }> }) {
  const { slug, assessmentId: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id < 1) notFound();
  const user = await getSession();
  if (!user) redirect(`/en/login?next=${encodeURIComponent(`/en/courses/${slug}/assessments/${id}`)}`);
  await ensureSchema();
  const result = await pool.query("SELECT a.id FROM assessments a JOIN courses c ON c.id=a.course_id WHERE a.id=$1 AND c.slug=$2 AND a.status='published' AND c.status='published'", [id, slug]);
  if (!result.rowCount) notFound();
  return <article className="gin-en-page" dir="ltr"><nav className="gin-en-breadcrumb"><Link href="/en">Home</Link> / <Link href="/en/courses">Learning Library</Link> / <Link href={`/en/courses/${slug}`}>Back to course</Link></nav><AssessmentAttempt assessmentId={id} locale="en"/></article>;
}
