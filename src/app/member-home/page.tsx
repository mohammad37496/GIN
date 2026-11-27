import type { Metadata } from "next";
import OfficialMemberHome from "@/components/official-member-home";

export const metadata: Metadata = {
  title: "Member Home | Global Information Network",
  description: "Sign in to your Global Information Network member portal.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/member-home", languages: {
    en: "/member-home", de: "/de/mitgliederbereich", fr: "/fr/accueil-des-membres", es: "/es/bienvenidos",
    hu: "/hu/tag-home", sq: "/sq/shtepia-e-anetarit", pt: "/pt/pagina-inicial-do-membro", "x-default": "/member-home",
  } },
};

export default function MemberHomePage() { return <OfficialMemberHome locale="en"/>; }
