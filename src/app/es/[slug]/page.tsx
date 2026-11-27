import type { Metadata } from "next";
import { officialPublicLocales } from "@/lib/official-public-locales";
import { officialReferencePageParams } from "@/lib/official-public-reference-routes";
import { generateOfficialPublicLocaleMetadata, renderOfficialPublicLocalePage } from "@/lib/official-public-locale-route";

const locale = officialPublicLocales.es;
const aboutSlug = locale.aboutPath.split("/").pop()!;
const contactSlug = locale.contactPath.split("/").pop()!;
export function generateStaticParams() { return [...[{ slug: aboutSlug }, { slug: contactSlug }], ...officialReferencePageParams("es")]; }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; return generateOfficialPublicLocaleMetadata("es", slug); }
export default async function SpanishPublicInfo({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return renderOfficialPublicLocalePage("es", slug); }
