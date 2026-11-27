import type { Metadata } from "next";
import { officialPublicLocales } from "@/lib/official-public-locales";
import { officialReferencePageParams } from "@/lib/official-public-reference-routes";
import { generateOfficialPublicLocaleMetadata, renderOfficialPublicLocalePage } from "@/lib/official-public-locale-route";

const locale = officialPublicLocales.pt;
const aboutSlug = locale.aboutPath.split("/").pop()!;
const contactSlug = locale.contactPath.split("/").pop()!;
export function generateStaticParams() { return [...[{ slug: aboutSlug }, { slug: contactSlug }], ...officialReferencePageParams("pt")]; }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; return generateOfficialPublicLocaleMetadata("pt", slug); }
export default async function PortuguesePublicInfo({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return renderOfficialPublicLocalePage("pt", slug); }
