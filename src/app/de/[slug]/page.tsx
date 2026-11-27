import type { Metadata } from "next";
import { officialPublicLocales } from "@/lib/official-public-locales";
import { officialReferencePageParams } from "@/lib/official-public-reference-routes";
import { generateOfficialPublicLocaleMetadata, renderOfficialPublicLocalePage } from "@/lib/official-public-locale-route";

const locale = officialPublicLocales.de;
const aboutSlug = locale.aboutPath.split("/").pop()!;
const contactSlug = locale.contactPath.split("/").pop()!;
export function generateStaticParams() { return [...[{ slug: aboutSlug }, { slug: contactSlug }], ...officialReferencePageParams("de")]; }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; return generateOfficialPublicLocaleMetadata("de", slug); }
export default async function GermanPublicInfo({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return renderOfficialPublicLocalePage("de", slug); }
