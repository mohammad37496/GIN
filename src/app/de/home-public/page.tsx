import type { Metadata } from "next";
import OfficialPublicHome from "@/components/official-public-home";
import { officialPublicLocales, officialPublicLocaleAlternates } from "@/lib/official-public-locales";

const page = officialPublicLocales.de;
export const metadata: Metadata = { title: page.copy.welcome, description: page.copy.intro, alternates: { canonical: page.homePath, languages: officialPublicLocaleAlternates("homePath") }, openGraph: { title: page.copy.welcome, description: page.copy.intro, locale: "de_DE", type: "website", images: ["/gin/gin-social-card.png"] } };
export default function GermanPublicHome() { return <OfficialPublicHome locale="de"/>; }
