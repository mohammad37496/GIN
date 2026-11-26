import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { ensureSchema, pool } from "@/lib/db";
import { englishContent } from "@/lib/bilingual-content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Learning Library", description: "Browse published GIN learning courses and follow your course progress.", alternates: { canonical: "/en/courses", languages: { en: "/en/courses", fa: "/fa/courses" } }, openGraph: { title: "Learning Library | GIN", description: "Browse published GIN learning courses and follow your course progress.", url: "/en/courses", siteName: "Global Information Network", type: "website", images: ["/gin/gin-social-card.png"] }, twitter: { card: "summary_large_image", title: "Learning Library | GIN", description: "Browse published GIN learning courses and follow your course progress.", images: ["/gin/gin-social-card.png"] } };

export default async function EnglishCoursesPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const filters = await searchParams;
  const query = (filters.q ?? "").trim().slice(0, 100);
  const category = filters.category?.trim().slice(0, 100) || "";
  let categories: { rows: { slug: string; name_en: string | null }[] } = { rows: [] };
  let courses: { rows: { id: number; slug: string; title_en: string | null; summary_en: string | null; access_type: string; estimated_minutes: number | null; lesson_count: number; categories: string[]; is_enrolled: boolean }[] } = { rows: [] };
  let catalogUnavailable = false;
  try {
    await ensureSchema();
    const user = await getSession();
    const [categoryResult, courseResult] = await Promise.all([
      pool.query("SELECT slug,name_en FROM course_categories WHERE is_active=TRUE ORDER BY position,slug"),
      pool.query(`SELECT c.id,c.slug,c.title_en,c.summary_en,c.access_type,c.estimated_minutes,
        COUNT(DISTINCT l.id)::int AS lesson_count,
        COALESCE(ARRAY_AGG(DISTINCT cc.name_en) FILTER(WHERE cc.id IS NOT NULL AND cc.name_en IS NOT NULL AND BTRIM(cc.name_en)<>''),'{}') AS categories,
        EXISTS(SELECT 1 FROM course_enrollments e WHERE e.course_id=c.id AND e.user_id=$1 AND e.status IN ('active','completed') AND (e.expires_at IS NULL OR e.expires_at>NOW())) AS is_enrolled
        FROM courses c LEFT JOIN course_sections s ON s.course_id=c.id
        LEFT JOIN lessons l ON l.section_id=s.id AND l.status='published'
        LEFT JOIN course_category_links ccl ON ccl.course_id=c.id LEFT JOIN course_categories cc ON cc.id=ccl.category_id
        WHERE c.status='published' AND ($2::text='' OR EXISTS(SELECT 1 FROM course_category_links fcl JOIN course_categories fc ON fc.id=fcl.category_id WHERE fcl.course_id=c.id AND fc.slug=$2))
        AND ($3::text='' OR c.title_en ILIKE '%'||$3||'%' OR c.summary_en ILIKE '%'||$3||'%')
        GROUP BY c.id ORDER BY c.published_at DESC NULLS LAST,c.id DESC`, [user?.id ?? null, category, query]),
    ]);
    categories = categoryResult;
    courses = courseResult;
  } catch {
    catalogUnavailable = true;
  }

  return <article className="gin-en-page">
    <div className="gin-en-breadcrumb"><Link href="/en">Home</Link> / Learning Library</div>
    <h1>Learning Library</h1>
    <p className="gin-en-page-intro">Browse published courses, explore the curriculum and track your progress in your member account.</p>
    <section className="gin-en-section">
      <form action="/en/courses" method="get" className="gin-en-course-filters">
        <label>Search courses<input name="q" defaultValue={query} placeholder="Course title or description" maxLength={100} /></label>
        <label>Category<select name="category" defaultValue={category}><option value="">All categories</option>{categories.rows.map((item) => <option key={item.slug} value={item.slug}>{englishContent(item.name_en)}</option>)}</select></label>
        <button className="gin-en-button">Search</button>
      </form>
    </section>
    {catalogUnavailable ? <section className="gin-en-section"><h2>Learning Library Temporarily Unavailable</h2><p>The portal course database is not available right now. Please try again later or contact member support.</p></section> : courses.rows.length ? <div className="gin-en-course-grid">{courses.rows.map((course) => <article className="gin-en-section" key={course.id}><span className="gin-en-course-kicker">{course.access_type === "free" ? "OPEN COURSE" : course.access_type === "members" ? "MEMBER COURSE" : "PAID COURSE"}</span><h2 dir="ltr"><Link href={`/en/courses/${course.slug}`}>{englishContent(course.title_en)}</Link></h2><p dir="ltr">{englishContent(course.summary_en)}</p><div className="gin-en-event-meta"><span>{course.lesson_count} lessons</span><span>{course.estimated_minutes ? `${course.estimated_minutes} minutes` : "Flexible duration"}</span><span>{course.is_enrolled ? "Enrolled" : "Not enrolled"}</span></div><Link className="gin-en-button gin-en-button-alt" href={`/en/courses/${course.slug}`}>View course</Link></article>)}</div> : <section className="gin-en-section"><h2>No courses found</h2><p>Try a different search term or category. New courses appear here after publication.</p><Link href="/en/courses">Show all courses</Link></section>}
  </article>;
}
