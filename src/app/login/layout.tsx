import type { Metadata } from "next";

export const metadata: Metadata = { title: "ورود اعضا", robots: { index: false, follow: false }, alternates: { canonical: "/fa/login", languages: { fa: "/fa/login", en: "/en/login" } } };

export default function LoginLayout({ children }: { children: React.ReactNode }) { return children; }
