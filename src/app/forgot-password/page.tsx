import type { Metadata } from "next";
import Link from "next/link";
import { GinLogo } from "@/components/gin-brand";
import { PasswordResetRequestForm } from "@/components/password-reset-forms";

export const metadata: Metadata = { title: "بازیابی رمز عبور", robots: { index: false, follow: false } };

export default function ForgotPasswordPage() {
  return <main className="auth-page"><Link href="/" className="brand auth-brand" aria-label="GIN صفحه اصلی"><GinLogo width={220} height={50} /></Link><PasswordResetRequestForm locale="fa" /><p className="auth-legal">بازیابی فقط برای ایمیل ثبت‌شده در پروفایل حساب محلی انجام می‌شود.</p></main>;
}
