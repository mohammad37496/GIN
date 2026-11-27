import type { Metadata } from "next";
import OfficialPublicHome from "@/components/official-public-home";
import { officialPublicLocales, officialPublicLocaleAlternates } from "@/lib/official-public-locales";

const page = officialPublicLocales.hu;
export const metadata: Metadata = { title: page.copy.welcome, description: page.copy.intro, alternates: { canonical: page.homePath, languages: officialPublicLocaleAlternates("homePath") }, openGraph: { title: page.copy.welcome, description: page.copy.intro, locale: "hu_HU", type: "website", images: ["/gin/gin-social-card.png"] } };
export default function HungarianPublicHome() { return <OfficialPublicHome locale="hu"/>; }
