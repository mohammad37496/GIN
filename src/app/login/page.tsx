"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowLeft, LockKeyhole } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); setBusy(true); setError(""); try { const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "ورود انجام نشد."); window.location.href = data.redirectTo; } catch (e) { setError(e instanceof Error ? e.message : "خطا در ارتباط با سرور"); } finally { setBusy(false); } }
  return <main className="auth-page"><Link href="/" className="brand auth-brand"><span className="brand-mark">G</span> GIN</Link><section className="auth-card"><div className="auth-icon"><LockKeyhole/></div><span className="eyebrow">WELCOME BACK</span><h1>خوش برگشتید</h1><p className="muted">برای ورود به فضای اختصاصی GIN اطلاعات خود را وارد کنید.</p><form onSubmit={submit} className="auth-form"><label>نام کاربری<input autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} required minLength={3}/></label><label>رمز عبور<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>{error && <div className="form-alert">{error}</div>}<button className="button full-button" disabled={busy}>{busy ? "در حال بررسی..." : "ورود به حساب"}<ArrowLeft size={17}/></button></form><div className="auth-foot">هنوز حساب ندارید؟ <Link href="/register">ثبت‌نام کنید</Link></div></section><p className="auth-legal">دسترسی به سامانه پس از تأیید مدیر فعال می‌شود.</p></main>;
}
