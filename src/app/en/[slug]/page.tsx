import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { englishPublicPages } from "@/lib/english-public-pages";
import { EnglishRegistrationForm } from "@/components/english-auth-forms";
import EnglishSupportForm from "@/components/english-support-form";
import { persianPathForEnglishPath } from "@/lib/locale-routes";
import EnglishContactForm from "@/components/english-contact-form";
import EnglishHotelGallery from "@/components/english-hotel-gallery";
import EnglishMembershipLevelsTable from "@/components/english-membership-levels-table";
import { EnglishAboutUsContent, EnglishWhoWeAreContent, EnglishWhatWeOfferContent, EnglishMemberBenefitsContent, EnglishAssociateBenefitsContent, EnglishOurTrainingContent, EnglishEventsContent, EnglishPersonalMasteryContent, EnglishClubhousesContent } from "@/components/english-reference-pages";
import JsonLd from "@/components/json-ld";
import { buildBreadcrumbSchema, buildFaqSchema } from "@/lib/structured-data";

export const dynamic = "force-dynamic";

function sectionAnchor(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function generateStaticParams() {
  return Object.keys(englishPublicPages).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = englishPublicPages[slug];
  if (!page) return {};
  const faPath = persianPathForEnglishPath(`/en/${slug}`);
  const hasPersianCounterpart = faPath !== "/fa";
  const description = page.description ?? page.intro;
  return {
    title: /\bGIN\b/i.test(page.title) ? { absolute: page.title } : page.title,
    description,
    alternates: { canonical: `/en/${slug}`, languages: hasPersianCounterpart ? { en: `/en/${slug}`, fa: faPath } : { en: `/en/${slug}` } },
    ...(slug === "support" ? { robots: { index: false, follow: false } } : {}),
    openGraph: { title: page.title, description, url: `/en/${slug}`, siteName: "Global Information Network", locale: "en_US", type: "article", images: [{ url: "/gin/gin-social-card.png", width: 1200, height: 630, alt: page.title }] },
    twitter: { card: "summary_large_image", title: page.title, description, images: ["/gin/gin-social-card.png"] },
  };
}

export default async function EnglishPublicInfoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = englishPublicPages[slug];
  if (!page) notFound();

  const user = slug === "support" ? await getSession() : null;
  const breadcrumbSchema = buildBreadcrumbSchema([{ name: "Home", path: "/en" }, { name: page.title, path: `/en/${slug}` }]);
  const faqSchema = slug === "faq" ? buildFaqSchema(page.sections.map((section) => ({ question: section.title, answer: section.body }))) : null;
  return (
    <article className="gin-en-page">
      <JsonLd data={[breadcrumbSchema, faqSchema]} />
      {! ["about-us", "who-we-are", "what-we-offer", "our-training", "member-benefits", "member-benefits-associate", "our-events", "gin-hotels", "clubhouses-and-lodges", "the-gin-cruise-ship", "personal-mastery", "faq", "membership-levels", "the-gin-success-system", "contact-us"].includes(slug) && <div className="gin-en-breadcrumb"><Link href="/en">Home</Link> / {page.eyebrow}</div>}
      <h1>{page.title}</h1>
      {page.intro && <p className="gin-en-page-intro">{slug === "faq" ? <>We are thrilled you have questions about joining as a GIN. Below are a list of questions we regularly hear from those who have just learned about our Club. Are you a Member with a question? We would be glad to hear from you on our <Link href="/en/support">Support page</Link>.</> : page.intro}</p>}
      {page.legalNotice && <p className="gin-en-legal-notice">{page.legalNotice}</p>}
      {page.image && <Image className="gin-en-page-visual" src={page.image} alt={page.title} width={1000} height={420} priority sizes="(max-width: 768px) 100vw, 70vw" />}
      <div className="gin-en-sections">
        {page.sections.map((section) => slug === "faq"
          ? <details className="gin-en-faq-item" id={sectionAnchor(section.title)} key={section.title}><summary>{section.title}</summary><div><p>{section.body}</p></div></details>
          : <section className="gin-en-section" id={sectionAnchor(section.title)} key={section.title}><h2>{section.title}</h2><p>{section.body}</p>{section.bullets && <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}</section>)}
      </div>
      {slug === "about-us" ? <EnglishAboutUsContent /> : null}
      {slug === "who-we-are" ? <EnglishWhoWeAreContent /> : null}
      {slug === "what-we-offer" ? <EnglishWhatWeOfferContent /> : null}
      {slug === "our-training" ? <EnglishOurTrainingContent /> : null}
      {slug === "member-benefits" ? <EnglishMemberBenefitsContent /> : null}
      {slug === "member-benefits-associate" ? <EnglishAssociateBenefitsContent /> : null}
      {slug === "our-events" ? <EnglishEventsContent /> : null}
      {slug === "personal-mastery" ? <EnglishPersonalMasteryContent /> : null}
      {slug === "clubhouses-and-lodges" ? <EnglishClubhousesContent /> : null}
      {slug === "contact-us" ? <div className="gin-en-contact-details"><p>You may call us at <a href="tel:+17086699544">+1 708-669-9544</a></p><p>Monday – Friday, 8:00 AM – 5:00 PM (Chicago, Central Time)</p></div> : null}
      {slug === "contact-us" ? <EnglishContactForm /> : null}
      {slug === "gin-hotels" ? <EnglishHotelGallery /> : null}
      {slug === "membership-levels" ? <><EnglishMembershipLevelsTable /><p className="gin-en-membership-disclaimer">GIN states that it is an informational and member-sharing association. Its materials are not financial, tax, legal, investment or medical advice. Consult independent qualified professionals before making decisions.</p></> : null}
      {slug === "the-gin-success-system" ? <section className="gin-en-success-system"><p><strong>The GIN Success System for Total Success in Life</strong></p><p><strong>The “GIN System” consists of 5 key elements:</strong></p><ol><li>Audio training</li><li>Books</li><li>Events</li><li>Recognition</li><li>Relationships</li></ol><p><strong>The 5 ingredients of this “System”, when used together, creates a synergistic effect...</strong></p><Image src="/gin/oldsystem-4.webp" alt="GIN success system" width={1200} height={760} sizes="(max-width: 768px) 100vw, 70vw" /><p><a className="gin-en-button" href="https://signup.globalinformationnetwork.com/" target="_blank" rel="noreferrer">Apply For Membership</a></p></section> : null}
      {slug === "support" ? <EnglishSupportForm authenticated={Boolean(user)} /> : null}
      {slug === "member-benefits" && <section className="gin-en-section"><h2>Associate Member Benefits</h2><p>GIN also publishes a separate benefits page for Associate Members.</p><Link className="gin-en-button gin-en-button-alt" href="/en/member-benefits-associate">View Associate Member Benefits</Link></section>}
      {slug === "what-we-offer" && <section className="gin-en-section"><h2>Explore the GIN Training Library</h2><p>GIN publishes a separate overview of its member training courses and learning formats.</p><Link className="gin-en-button gin-en-button-alt" href="/en/our-training">View Our Training</Link></section>}
      {slug === "our-events" && <section className="gin-en-section gin-en-video-section"><h2>GIN Event Presentations</h2><div className="gin-en-video-grid">
        <div className="gin-en-video-frame"><iframe src="https://iframe.mediadelivery.net/embed/34091/9d916f6f-12a5-4580-a11e-b0681c5f14bb" title="GIN Events presentation one" loading="lazy" allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /></div>
        <div className="gin-en-video-frame"><iframe src="https://iframe.mediadelivery.net/embed/34091/3d3338c0-56f8-4db2-b400-e6492cecf320" title="GIN Events presentation two" loading="lazy" allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /></div>
        <div className="gin-en-video-frame"><iframe src="https://iframe.mediadelivery.net/embed/34091/79e130ef-1ef9-40b4-b19f-5850aebfeced" title="GIN Events presentation three" loading="lazy" allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /></div>
      </div></section>}
      {slug === "become-a-member" ? <EnglishRegistrationForm headingLevel="h2" /> : null}
      {page.officialUrl && !["about-us", "who-we-are", "what-we-offer", "our-training", "member-benefits", "member-benefits-associate", "our-events", "gin-hotels", "clubhouses-and-lodges", "the-gin-cruise-ship", "personal-mastery", "membership-levels", "faq", "the-gin-success-system", "contact-us"].includes(slug) && <div className="gin-en-official-link"><a className="gin-en-button gin-en-button-alt" href={page.officialUrl} target="_blank" rel="noreferrer">{slug === "cookie-policy" ? "Read the official Privacy Policy (includes cookie information)" : "View the official GIN information"}</a></div>}
      {!["about-us", "who-we-are", "what-we-offer", "our-training", "member-benefits", "member-benefits-associate", "our-events", "gin-hotels", "clubhouses-and-lodges", "the-gin-cruise-ship", "personal-mastery", "membership-levels", "faq", "the-gin-success-system", "contact-us"].includes(slug) && <section className="gin-en-band"><h2>Explore the GIN Community</h2><p>Review the official membership information and application requirements before deciding whether to apply.</p><div className="gin-en-cta"><a className="gin-en-button" href="https://signup.globalinformationnetwork.com/" target="_blank" rel="noreferrer">Official Membership Application</a><Link className="gin-en-button gin-en-button-alt" href="/en/faq">Frequently Asked Questions</Link></div></section>}
    </article>
  );
}
