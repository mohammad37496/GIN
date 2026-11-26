import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Clock3, GraduationCap } from "lucide-react";
import PublicHeader from "@/components/public-header";
import PublicFooter from "@/components/public-footer";
import { getSession } from "@/lib/auth";
import { ensureSchema, pool } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "دوره‌های آموزشی", description: "فهرست دوره‌های آموزشی منتشرشده شبکه جهانی اطلاعات و مسیرهای یادگیری اعضا.", alternates: { canonical: "/fa/courses", languages: { fa: "/fa/courses", en: "/en/courses" } }, openGraph: { title: "دوره‌های آموزشی | GIN", description: "فهرست دوره‌های آموزشی منتشرشده شبکه جهانی اطلاعات.", url: "/fa/courses", siteName: "Global Information Network", type: "website", images: ["/gin/gin-social-card.png"] }, twitter: { card: "summary_large_image", title: "دوره‌های آموزشی | GIN", description: "فهرست دوره‌های آموزشی منتشرشده شبکه جهانی اطلاعات.", images: ["/gin/gin-social-card.png"] } };

export default async function CoursesPage({searchParams}:{searchParams:Promise<{q?:string;category?:string}>}) {
  await ensureSchema();
  const user = await getSession();
  const filters=await searchParams;const query=(filters.q??"").trim().slice(0,100);const category=filters.category?.trim().slice(0,100)||"";
  const categories=await pool.query("SELECT slug,name FROM course_categories WHERE is_active=TRUE ORDER BY position,name");
  const result = await pool.query(`SELECT c.id,c.slug,c.title,c.summary,c.access_type,c.estimated_minutes,
    COUNT(DISTINCT l.id)::int AS lesson_count,
    COALESCE(ARRAY_AGG(DISTINCT cc.name) FILTER(WHERE cc.id IS NOT NULL),'{}') AS categories,
    EXISTS(SELECT 1 FROM course_enrollments e WHERE e.course_id=c.id AND e.user_id=$1 AND e.status IN ('active','completed') AND (e.expires_at IS NULL OR e.expires_at>NOW())) AS is_enrolled
    FROM courses c LEFT JOIN course_sections s ON s.course_id=c.id
    LEFT JOIN lessons l ON l.section_id=s.id AND l.status='published'
    LEFT JOIN course_category_links ccl ON ccl.course_id=c.id LEFT JOIN course_categories cc ON cc.id=ccl.category_id
    WHERE c.status='published' AND ($2::text='' OR EXISTS(SELECT 1 FROM course_category_links fcl JOIN course_categories fc ON fc.id=fcl.category_id WHERE fcl.course_id=c.id AND fc.slug=$2))
      AND ($3::text='' OR c.title ILIKE '%'||$3||'%' OR c.summary ILIKE '%'||$3||'%')
    GROUP BY c.id ORDER BY c.published_at DESC NULLS LAST,c.id DESC`, [user?.id ?? null,category,query]);
  return <><PublicHeader/><main className="catalog-page"><div className="public-container"><div className="catalog-heading"><span className="eyebrow">GIN LEARNING LIBRARY</span><h1>دوره‌های آموزشی</h1><p>مسیر یادگیری موردعلاقه خود را پیدا کنید و پیشرفتتان را در پنل اعضا دنبال کنید.</p></div><form className="course-catalog-filters" action="/courses" method="get"><input name="q" value={query} placeholder="جست‌وجوی نام یا توضیح دوره"/><select name="category" defaultValue={category}><option value="">همه دسته‌بندی‌ها</option>{categories.rows.map(item=><option key={item.slug} value={item.slug}>{item.name}</option>)}</select><button className="button button-small">جست‌وجو</button></form>{result.rows.length ? <div className="course-grid">{result.rows.map((course) => <article className="course-card" key={course.id}><div className="course-card-art"><span>GIN</span><small>LEARNING SERIES</small><GraduationCap size={31}/></div><div className="course-card-body"><div className="course-meta"><span><BookOpen size={14}/> {course.lesson_count} درس</span><span><Clock3 size={14}/> {course.estimated_minutes ? `${course.estimated_minutes} دقیقه` : "زمان متغیر"}</span></div><h2><Link href={`/courses/${course.slug}`}>{course.title}</Link></h2><p>{course.summary}</p>{course.categories.length>0&&<div className="course-category-tags">{course.categories.map((name:string)=><span key={name}>{name}</span>)}</div>}<div className="course-card-bottom"><Link href={`/courses/${course.slug}`} className="text-arrow">مشاهده دوره <span>←</span></Link>{course.is_enrolled && <span className="course-enrolled">ثبت‌نام‌شده</span>}</div></div></article>)}</div> : <div className="catalog-empty"><GraduationCap size={34}/><h2>دوره‌ای با این فیلتر پیدا نشد</h2><p>عبارت جست‌وجو یا دسته‌بندی را تغییر دهید.</p><Link href="/courses" className="text-arrow">نمایش همه دوره‌ها</Link></div>}</div></main><PublicFooter/></>;
}
