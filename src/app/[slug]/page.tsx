import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import PublicHeader from "@/components/public-header";
import PublicFooter from "@/components/public-footer";
import PersianContactForm from "@/components/persian-contact-form";
import PersianHotelGallery from "@/components/persian-hotel-gallery";
import { publicPages } from "@/lib/public-pages";
import PersianPublicReferencePage, { persianPublicPageMetadata } from "@/components/persian-public-reference-page";
import JsonLd from "@/components/json-ld";
import { buildBreadcrumbSchema, buildFaqSchema } from "@/lib/structured-data";
import { persianDynamicReferenceSlugs } from "@/lib/persian-public-pages";

export const dynamic = "force-dynamic";

const pageVisuals: Record<string, { src: string; alt: string }> = {
  "who-we-are": { src: "/gin/gin-community.webp", alt: "گردهمایی جامعه جهانی GIN" },
  "why-join": { src: "/gin/gin-training.webp", alt: "فضای آموزشی اعضای GIN" },
  about: { src: "/gin/gin-community.webp", alt: "ارتباط و یادگیری اعضای GIN" },
  "what-we-offer": { src: "/gin/gin-training.webp", alt: "آموزش و یادگیری در GIN" },
  "member-benefits": { src: "/gin/paris-intercontinental.webp", alt: "رویداد بین‌المللی GIN" },
  "success-system": { src: "/gin/gin-training.webp", alt: "مسیر یادگیری و توسعه فردی" },
  hotels: { src: "/gin/paris-intercontinental.webp", alt: "اطلاعات سفر و اقامت" },
  clubhouses: { src: "/gin/gin-community.webp", alt: "گردهمایی اعضای GIN" },
  cruise: { src: "/gin/gin-cruise.webp", alt: "کشتی تفریحی در برنامه سفر گروهی" },
  faq: { src: "/gin/gin-community.webp", alt: "پشتیبانی و راهنمای اعضای GIN" },
  contact: { src: "/gin/gin-training.webp", alt: "ارتباط با تیم GIN" },
};

export function generateStaticParams() {
  return [
    ...Object.keys(publicPages).map((slug) => ({ slug })),
    ...persianDynamicReferenceSlugs.map((slug) => ({ slug })),
  ];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (persianDynamicReferenceSlugs.includes(slug as (typeof persianDynamicReferenceSlugs)[number])) return persianPublicPageMetadata(slug);
  const page = publicPages[slug];
  if (!page) return {};
  const englishSlug: Record<string, string> = {
    about: "about-us", "who-we-are": "who-we-are", "why-join": "what-we-offer",
    "what-we-offer": "what-we-offer", "member-benefits": "member-benefits",
    "success-system": "the-gin-success-system", hotels: "gin-hotels",
    clubhouses: "clubhouses-and-lodges", cruise: "the-gin-cruise-ship",
    faq: "faq", contact: "contact-us",
  };
  const canonicalSlug = slug === "why-join" ? "what-we-offer" : slug;
  return {
    title: /\bGIN\b/i.test(page.title) ? { absolute: page.title } : page.title,
    description: page.intro,
    alternates: { canonical: `/fa/${canonicalSlug}`, languages: { fa: `/fa/${canonicalSlug}`, en: `/en/${englishSlug[slug] ?? ""}` } },
    openGraph: { title: page.title, description: page.intro, url: `/fa/${canonicalSlug}`, siteName: "Global Information Network", locale: "fa_IR", type: "article", images: [{ url: "/gin/gin-social-card.png", width: 1200, height: 630, alt: page.title }] },
    twitter: { card: "summary_large_image", title: page.title, description: page.intro, images: ["/gin/gin-social-card.png"] },
  };
}

export default async function PublicInfoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (persianDynamicReferenceSlugs.includes(slug as (typeof persianDynamicReferenceSlugs)[number])) return <PersianPublicReferencePage slug={slug}/>;
  const page = publicPages[slug];
  if (!page) notFound();
  const visual = pageVisuals[slug] ?? pageVisuals.about;
  const isServiceDirectory = slug === "hotels" || slug === "clubhouses" || slug === "cruise";
  const breadcrumbSchema = buildBreadcrumbSchema([{ name: "خانه", path: "/fa" }, { name: page.title, path: `/fa/${slug}` }]);
  const faqSchema = slug === "faq" ? buildFaqSchema(page.sections.map((section) => ({ question: section.title, answer: section.body }))) : null;
  return <><PublicHeader/><JsonLd data={[breadcrumbSchema, faqSchema]}/><main className="public-page"><div className="public-container"><div className="page-breadcrumb"><Link href="/fa">خانه</Link><span>/</span><span>{page.eyebrow}</span></div><section className="page-hero"><div className="page-hero-copy"><span className="eyebrow">{page.eyebrow}</span><h1>{page.title}</h1><p>{page.intro}</p>{!isServiceDirectory && <Link href="/fa/register" className="button">ایجاد حساب پورتال <ArrowLeft size={17}/></Link>}</div><div className="page-hero-visual"><Image src={visual.src} alt={visual.alt} fill priority sizes="(max-width: 850px) 100vw, 42vw"/><span>GLOBAL INFORMATION NETWORK</span></div></section>{slug === "faq" ? <section className="page-faq-sections" aria-label="پرسش‌های متداول">{page.sections.map((section) => <details className="page-faq-item" key={section.title}><summary>{section.title}</summary><p>{section.body}</p></details>)}</section> : <section className="page-sections">{page.sections.map((section, index) => <article className="info-card" key={section.title}><span className="info-index">{String(index + 1).padStart(2,"0")}</span><div><h2>{section.title}</h2><p>{section.body}</p></div><CheckCircle2 className="info-check" size={21}/></article>)}</section>}{slug === "hotels" && <PersianHotelGallery/>}{slug === "contact" && <PersianContactForm/>}<section className="page-cta"><div><span className="eyebrow">گام بعدی شما</span><h2>{isServiceDirectory ? "از برنامه‌های تأییدشده GIN باخبر شوید" : "مسیر یادگیری خود را آغاز کنید"}</h2><p>{isServiceDirectory ? "برای پرسش درباره اطلاعات سفر یا مکان‌های گردهمایی، از مسیر پشتیبانی پیام بفرستید." : "حساب کاربری بسازید و پس از تأیید عضویت، وارد فضای اختصاصی GIN شوید."}</p></div><Link href={isServiceDirectory ? "/fa/contact" : "/fa/register"} className="button">{isServiceDirectory ? "تماس با GIN" : "ایجاد حساب پورتال"} <ArrowLeft size={17}/></Link></section></div></main><PublicFooter/></>;
}
