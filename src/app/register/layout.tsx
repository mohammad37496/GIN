import type { Metadata } from "next";

export const metadata: Metadata = { title: "درخواست حساب کاربری", robots: { index: false, follow: false }, alternates: { canonical: "/fa/register", languages: { fa: "/fa/register", en: "/en/register" } } };

export default function RegisterLayout({ children }: { children: React.ReactNode }) { return children; }
