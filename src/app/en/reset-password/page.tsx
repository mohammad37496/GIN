import type { Metadata } from "next";
import { PasswordResetConfirmForm } from "@/components/password-reset-forms";

export const metadata: Metadata = { title: "Choose a New Password", robots: { index: false, follow: false } };

export default function EnglishResetPasswordPage() { return <div className="gin-en-page"><PasswordResetConfirmForm locale="en" /></div>; }
