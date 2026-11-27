import type { Metadata } from "next";
import OfficialPublicHome from "@/components/official-public-home";
import { officialPublicLocales, officialPublicLocaleAlternates } from "@/lib/official-public-locales";

const page = officialPublicLocales.fr;
export const metadata: Metadata = { title: page.copy.welcome, description: page.copy.intro, alternates: { canonical: page.homePath, languages: officialPublicLocaleAlternates("homePath") }, openGraph: { title: page.copy.welcome, description: page.copy.intro, locale: "fr_FR", type: "website", images: ["/gin/gin-social-card.png"] } };
export default function FrenchPublicHome() { return <OfficialPublicHome locale="fr"/>; }
