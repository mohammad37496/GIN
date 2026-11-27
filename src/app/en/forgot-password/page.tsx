import type { Metadata } from "next";
import { PasswordResetRequestForm } from "@/components/password-reset-forms";

export const metadata: Metadata = { title: "Reset Password", robots: { index: false, follow: false } };

export default function EnglishForgotPasswordPage() { return <div className="gin-en-page"><PasswordResetRequestForm locale="en" /></div>; }
