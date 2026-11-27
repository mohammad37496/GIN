import type { Metadata } from "next";
import Link from "next/link";
import { GinLogo } from "@/components/gin-brand";
import { PasswordResetConfirmForm } from "@/components/password-reset-forms";

export const metadata: Metadata = { title: "تغییر رمز عبور", robots: { index: false, follow: false } };

export default function ResetPasswordPage() {
  return <main className="auth-page"><Link href="/" className="brand auth-brand" aria-label="GIN صفحه اصلی"><GinLogo width={220} height={50} /></Link><PasswordResetConfirmForm locale="fa" /><p className="auth-legal">پیوند بازیابی پس از ۳۰ دقیقه منقضی می‌شود.</p></main>;
}
