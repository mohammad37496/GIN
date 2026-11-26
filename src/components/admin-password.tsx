"use client";

import { useState, type FormEvent } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import StaffLocalized, { type StaffLocale } from "@/components/staff-localization";

export default function AdminPassword({ locale = "fa" }: { locale?: StaffLocale }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSuccess(false);
    setLoading(true);
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "تغییر رمز عبور انجام نشد.");
      setSuccess(true);
      setMessage(data.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "خطای غیرمنتظره رخ داد.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <StaffLocalized locale={locale}><section className="password-panel">
      <div className="panel-heading">
        <div><h2>امنیت حساب مدیر</h2><p>برای تغییر رمز، ابتدا رمز فعلی را تأیید کنید.</p></div>
        <div className="password-icon"><KeyRound size={19} /></div>
      </div>
      <form className="password-form" onSubmit={submit}>
        <label>رمز عبور فعلی<input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required maxLength={72} /></label>
        <label>رمز عبور جدید<input type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required minLength={14} maxLength={72} /><small>حداقل ۱۴ نویسه؛ از رمز منحصربه‌فرد استفاده کنید.</small></label>
        <label>تکرار رمز عبور جدید<input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={14} maxLength={72} /></label>
        {message && <div className={success ? "password-success" : "form-alert"} role="status">{success && <ShieldCheck size={16} />} {message}</div>}
        <button className="button button-small" type="submit" disabled={loading}>{loading ? "در حال ذخیره..." : "تغییر رمز عبور"}</button>
      </form>
    </section></StaffLocalized>
  );
}
