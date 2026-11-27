"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type Locale = "fa" | "en";

export function PasswordResetRequestForm({ locale }: { locale: Locale }) {
  const english = locale === "en";
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || (english ? "The request could not be completed." : "درخواست انجام نشد."));
      setMessage(data.message || (english ? "If the account exists, reset instructions will be sent when email delivery is available." : "اگر حسابی با این ایمیل وجود داشته باشد، دستورالعمل بازیابی ارسال خواهد شد."));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (english ? "Unable to connect to the server." : "خطا در ارتباط با سرور"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={english ? "gin-en-auth" : "auth-card"}>
      <h1>{english ? "Reset your password" : "بازیابی رمز عبور"}</h1>
      <p>{english ? "Enter the email address saved in your GIN portal profile." : "ایمیلی را وارد کنید که در پروفایل حساب GIN ثبت کرده‌اید."}</p>
      <form onSubmit={submit} className={english ? undefined : "auth-form"}>
        <label>{english ? "Email address" : "نشانی ایمیل"}<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} /></label>
        {error && <p className={english ? "gin-en-form-error" : "form-alert"} role="alert">{error}</p>}
        {message && <p className={english ? "gin-en-form-success" : "success-state"} role="status">{message}</p>}
        <button className={english ? "gin-en-button" : "button full-button"} disabled={busy}>{busy ? (english ? "Sending…" : "در حال ارسال...") : (english ? "Request reset link" : "درخواست پیوند بازیابی")}</button>
      </form>
      <div className={english ? "gin-en-auth-foot" : "auth-foot"}><Link href={english ? "/en/login" : "/login"}>{english ? "Back to login" : "بازگشت به ورود"}</Link></div>
    </section>
  );
}

export function PasswordResetConfirmForm({ locale }: { locale: Locale }) {
  const english = locale === "en";
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => setToken(new URLSearchParams(window.location.search).get("token") || ""), []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (password !== confirm) {
      setError(english ? "The passwords do not match." : "تکرار رمز عبور مطابقت ندارد.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, locale }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || (english ? "The reset link is invalid or expired." : "پیوند بازیابی نامعتبر یا منقضی شده است."));
      setMessage(data.message || (english ? "Password updated. Please sign in again." : "رمز عبور تغییر کرد. دوباره وارد شوید."));
      setToken("");
      setPassword("");
      setConfirm("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (english ? "Unable to connect to the server." : "خطا در ارتباط با سرور"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={english ? "gin-en-auth" : "auth-card"}>
      <h1>{english ? "Choose a new password" : "انتخاب رمز عبور جدید"}</h1>
      <p>{english ? "Reset links expire after 30 minutes and can only be used once." : "پیوند بازیابی پس از ۳۰ دقیقه منقضی می‌شود و فقط یک بار قابل استفاده است."}</p>
      <form onSubmit={submit} className={english ? undefined : "auth-form"}>
        <label>{english ? "New password" : "رمز عبور جدید"}<input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={10} maxLength={72} /></label>
        <label>{english ? "Confirm password" : "تکرار رمز عبور"}<input type="password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} required minLength={10} maxLength={72} /></label>
        {error && <p className={english ? "gin-en-form-error" : "form-alert"} role="alert">{error}</p>}
        {message && <p className={english ? "gin-en-form-success" : "success-state"} role="status">{message} <Link href={english ? "/en/login" : "/login"}>{english ? "Sign in" : "ورود"}</Link></p>}
        <button className={english ? "gin-en-button" : "button full-button"} disabled={busy || !token || Boolean(message)}>{busy ? (english ? "Updating…" : "در حال تغییر...") : (english ? "Update password" : "تغییر رمز عبور")}</button>
        {!token && <p role="alert">{english ? "A valid reset token is required." : "پیوند معتبر بازیابی لازم است."}</p>}
      </form>
      <div className={english ? "gin-en-auth-foot" : "auth-foot"}><Link href={english ? "/en/login" : "/login"}>{english ? "Back to login" : "بازگشت به ورود"}</Link></div>
    </section>
  );
}
