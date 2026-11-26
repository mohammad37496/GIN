import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import PublicHeader from "@/components/public-header";
import PublicFooter from "@/components/public-footer";
import { publicPages } from "@/lib/public-pages";
import { getSession } from "@/lib/auth";
import SupportForm from "@/components/support-form";

export const dynamic = "force-dynamic";

const legacyRedirects: Record<string, string> = {
  "about-us": "/about",
  "our-training": "/courses",
  "member-benefits-associate": "/member-benefits",
  "our-events": "/events",
  "membership-levels": "/membership",
  "contact-us": "/contact",
  "become-a-member": "/register",
  "gin-hotels": "/hotels",
  "gin-clubhouses": "/clubhouses",
  "gin-cruise-ship": "/cruise",
};

export function generateStaticParams() { return Object.keys(publicPages).map((slug) => ({ slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = publicPages[slug];
  return page ? { title: `${page.title} | GIN`, description: page.intro } : {};
}

export default async function PublicInfoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const destination = legacyRedirects[slug];
  if (destination) redirect(destination);
  const page = publicPages[slug];
  if (!page) notFound();
  const user = slug === "contact" ? await getSession() : null;
  return <><PublicHeader/><main className="public-page"><div className="public-container"><div className="page-breadcrumb"><Link href="/">خانه</Link><span>/</span><span>{page.eyebrow}</span></div><section className="page-hero"><span className="eyebrow">{page.eyebrow}</span><h1>{page.title}</h1><p>{page.intro}</p><Link href="/register" className="button">شروع عضویت <ArrowLeft size={17}/></Link><div className="page-hero-orb" aria-hidden="true">G</div></section><section className="page-sections">{page.sections.map((section, index) => <article className="info-card" key={section.title}><span className="info-index">0{index + 1}</span><div><h2>{section.title}</h2><p>{section.body}</p></div><CheckCircle2 className="info-check" size={21}/></article>)}</section>{slug === "contact" && <SupportForm authenticated={Boolean(user)}/>}<section className="page-cta"><div><span className="eyebrow">YOUR NEXT STEP</span><h2>مسیر یادگیری خود را آغاز کنید</h2><p>حساب کاربری بسازید و پس از تأیید عضویت، وارد فضای اختصاصی GIN شوید.</p></div><Link href="/register" className="button">درخواست عضویت <ArrowLeft size={17}/></Link></section></div></main><PublicFooter/></>;
}
