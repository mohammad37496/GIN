import type { Metadata } from "next";
import { EnglishLoginForm } from "@/components/english-auth-forms";

export const metadata: Metadata = { title: "Member Login", description: "Sign in to your Global Information Network portal account.", robots: { index: false, follow: false }, alternates: { canonical: "/en/login", languages: { en: "/en/login", fa: "/fa/login" } } };

export default function EnglishLoginPage() { return <EnglishLoginForm />; }
