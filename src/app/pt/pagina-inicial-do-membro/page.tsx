import type { Metadata } from "next";
import OfficialMemberHome from "@/components/official-member-home";

export const metadata: Metadata = { title: "Página inicial do membro | Global Information Network", robots: { index: false, follow: false }, alternates: { canonical: "/pt/pagina-inicial-do-membro", languages: { en: "/member-home", de: "/de/mitgliederbereich", fr: "/fr/accueil-des-membres", es: "/es/bienvenidos", hu: "/hu/tag-home", sq: "/sq/shtepia-e-anetarit", pt: "/pt/pagina-inicial-do-membro", "x-default": "/member-home" } } };
export default function PortugueseMemberHome() { return <OfficialMemberHome locale="pt"/>; }
