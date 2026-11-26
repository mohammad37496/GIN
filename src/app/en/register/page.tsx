import type { Metadata } from "next";
import { EnglishRegistrationForm } from "@/components/english-auth-forms";

export const metadata: Metadata = { title: "Create a Portal Account", description: "Create an account for the GIN learning portal.", robots: { index: false, follow: false }, alternates: { canonical: "/en/register", languages: { en: "/en/register", fa: "/fa/register" } } };

export default function EnglishRegisterPage() { return <EnglishRegistrationForm />; }
