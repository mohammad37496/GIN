import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import PublicHeader from "@/components/public-header";
import PublicFooter from "@/components/public-footer";
import AssessmentAttempt from "@/components/assessment-attempt";
import { getSession } from "@/lib/auth";
import { ensureSchema, pool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string; assessmentId: string }> }): Promise<Metadata> {
  const { slug, assessmentId } = await params;
  const canonical = `/fa/courses/${slug}/assessments/${assessmentId}`;
  return { title: "آزمون دوره", robots: { index: false, follow: false }, alternates: { canonical, languages: { fa: canonical, en: `/en/courses/${slug}/assessments/${assessmentId}` } } };
}

export default async function PersianAssessmentPage({ params }: { params: Promise<{ slug: string; assessmentId: string }> }) {
  const { slug, assessmentId: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id < 1) notFound();
  const user = await getSession();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/courses/${slug}/assessments/${id}`)}`);
  await ensureSchema();
  const result = await pool.query("SELECT a.id FROM assessments a JOIN courses c ON c.id=a.course_id WHERE a.id=$1 AND c.slug=$2 AND a.status='published' AND c.status='published'", [id, slug]);
  if (!result.rowCount) notFound();
  return <><PublicHeader/><main className="lesson-page"><div className="public-container"><div className="page-breadcrumb"><Link href="/">خانه</Link><span>/</span><Link href="/courses">دوره‌ها</Link><span>/</span><Link href={`/courses/${slug}`}>بازگشت به دوره</Link></div><AssessmentAttempt assessmentId={id} locale="fa"/></div></main><PublicFooter/></>;
}
