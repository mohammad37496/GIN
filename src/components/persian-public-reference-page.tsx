import type { Metadata } from "next";
import Link from "next/link";
import PublicFooter from "@/components/public-footer";
import PublicHeader from "@/components/public-header";
import JsonLd from "@/components/json-ld";
import { buildBreadcrumbSchema } from "@/lib/structured-data";
import { persianPublicPages } from "@/lib/persian-public-pages";

export function persianPublicPageMetadata(slug: string): Metadata {
  const page = persianPublicPages[slug];
  if (!page) return {};
  const englishSlug = slug === "privacy-policy" ? "privacy-policy-2" : slug;
  return {
    title: /\bGIN\b/i.test(page.title) ? { absolute: page.title } : page.title,
    description: page.description,
    alternates: { canonical: `/fa/${slug}`, languages: { fa: `/fa/${slug}`, en: `/en/${englishSlug}` } },
    openGraph: { title: page.title, description: page.description, url: `/fa/${slug}`, siteName: "Global Information Network", locale: "fa_IR", type: "article", images: ["/gin/gin-social-card.png"] },
    twitter: { card: "summary_large_image", title: page.title, description: page.description, images: ["/gin/gin-social-card.png"] },
  };
}

export default function PersianPublicReferencePage({ slug }: { slug: string }) {
  const page = persianPublicPages[slug];
  if (!page) return null;
  return <>
    <PublicHeader />
    <JsonLd data={buildBreadcrumbSchema([{ name: "خانه", path: "/fa" }, { name: page.title, path: `/fa/${slug}` }])} />
    <main className="persian-reference-page"><div className="public-container">
      <nav className="persian-reference-breadcrumb" aria-label="مسیر صفحه"><Link href="/">خانه</Link><span aria-hidden="true">/</span><span>{page.title}</span></nav>
      <article>
        <header className="persian-reference-heading"><span className="eyebrow">GLOBAL INFORMATION NETWORK</span><h1>{page.title}</h1><p>{page.intro}</p></header>
        {page.legalNotice && <aside className="persian-reference-legal-notice" aria-label="توضیح مهم حقوقی">{page.legalNotice}</aside>}
        <div className="persian-reference-sections">
          {page.sections.map((section) => <section key={section.title}><h2>{section.title}</h2><p>{section.body}</p>{section.bullets && <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}</section>)}
        </div>
        {page.eventVideoIds && <section className="persian-reference-videos" aria-labelledby="persian-event-videos-title"><h2 id="persian-event-videos-title">ویدئوهای معرفی رویدادهای GIN</h2><div className="persian-reference-video-grid">{page.eventVideoIds.map((id, index) => <div className="persian-reference-video-frame" key={id}><iframe src={`https://iframe.mediadelivery.net/embed/34091/${id}`} title={`ویدئوی معرفی رویدادهای GIN ${index + 1}`} loading="lazy" allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /></div>)}</div></section>}
        <div className="persian-reference-actions">
          <a className="button" href={page.officialUrl} target="_blank" rel="noreferrer">{slug === "become-a-member" ? "ورود به سامانه رسمی درخواست عضویت GIN" : "مشاهده منبع رسمی GIN"}</a>
          {slug === "become-a-member" && <Link className="button persian-reference-secondary" href="/register">ایجاد حساب جداگانه در پورتال آموزشی</Link>}
        </div>
        {slug === "become-a-member" && <p className="persian-reference-registration-note">ثبت‌نام در پورتال با درخواست عضویت رسمی GIN متفاوت است و به‌تنهایی عضویت رسمی ایجاد نمی‌کند.</p>}
      </article>
    </div></main>
    <PublicFooter />
  </>;
}
