"use client";

import { useEffect, useState } from "react";
import StaffLocalized, { type StaffLocale, staffDate } from "@/components/staff-localization";
import { getContactCountryLabel } from "@/lib/contact-countries";

type ContactSubmission = {
  id: number; first_name: string; last_name: string; email: string; phone: string;
  address_line1: string; address_line2: string | null; city: string; state_region: string | null;
  postal_code: string | null; country: string; preferred_language: string; secondary_language: string | null;
  preferred_contact_methods: string[] | null; telegram_handle: string | null; whatsapp_number: string | null;
  subject: string; message: string; sms_consent: boolean; legal_consent: boolean;
  status: "new" | "in_progress" | "resolved" | "closed"; created_at: string;
};

const statuses = [["new", "جدید"], ["in_progress", "در حال بررسی"], ["resolved", "پاسخ داده شد"], ["closed", "بسته شده"]] as const;
const contactMethodLabelsFa: Record<string, string> = { Email: "ایمیل", "Telephone Call": "تماس تلفنی", Telegram: "تلگرام", WhatsApp: "واتساپ" };
const contactMethodLabelsEn: Record<string, string> = { Email: "Email", "Telephone Call": "Phone call", Telegram: "Telegram", WhatsApp: "WhatsApp" };

export default function AdminContactSubmissions({locale="fa"}:{locale?:StaffLocale}) {
  const [items, setItems] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/contact-submissions", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "دریافت فرم‌های تماس انجام نشد.");
      setItems(data.submissions);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "دریافت فرم‌های تماس انجام نشد.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function updateStatus(id: number, status: ContactSubmission["status"]) {
    setBusyId(id);
    setError("");
    try {
      const response = await fetch(`/api/admin/contact-submissions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "تغییر وضعیت انجام نشد.");
      setItems((current) => current.map((item) => item.id === id ? { ...item, status: data.submission.status } : item));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تغییر وضعیت انجام نشد.");
    } finally {
      setBusyId(null);
    }
  }

  return <StaffLocalized locale={locale}><section className="admin-section" id="contact-submissions">
    <div className="section-heading"><div><span className="eyebrow">PUBLIC CONTACT FORM</span><h2>درخواست‌های تماس عمومی</h2><p>اطلاعات تماس، پیام و رضایت‌های ثبت‌شده از فرم انگلیسی سایت.</p></div><button className="button button-ghost" onClick={() => void load()} disabled={loading}>بروزرسانی</button></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {loading ? <p>در حال دریافت درخواست‌ها…</p> : items.length ? <div className="admin-contact-list">{items.map((item) => <article className="admin-contact-card" key={item.id}>
      <div className="admin-contact-head"><div><strong>#{item.id} · {item.first_name} {item.last_name}</strong><p>{item.subject}</p></div><select aria-label={locale==="en"?`Submission status ${item.id}`:`وضعیت درخواست ${item.id}`} value={item.status} disabled={busyId === item.id} onChange={(event) => void updateStatus(item.id, event.target.value as ContactSubmission["status"])}>{statuses.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></div>
      <p>{item.message}</p>
      <div className="admin-contact-meta"><a href={`mailto:${encodeURIComponent(item.email)}?subject=${encodeURIComponent(`Re: ${item.subject}`)}`}>{item.email}</a><a href={`tel:${encodeURIComponent(item.phone)}`}>{item.phone}</a><span>{(item.preferred_contact_methods ?? []).map((method) => (locale==="en"?contactMethodLabelsEn:contactMethodLabelsFa)[method] ?? method).join(locale==="en"?", ":"، ") || "—"}</span><span>{item.preferred_language}{item.secondary_language ? ` / ${item.secondary_language}` : ""}</span><span>{staffDate(item.created_at,locale,{dateStyle:"medium",timeStyle:"short"})}</span></div>
      <details><summary>اطلاعات تکمیلی و رضایت‌ها</summary><p>{[item.address_line1,item.address_line2,item.city,item.state_region,item.postal_code,getContactCountryLabel(item.country)].filter(Boolean).join(locale==="en"?", ":"، ")}</p><p>Telegram: {item.telegram_handle || "—"} · WhatsApp: {item.whatsapp_number || "—"}</p><p>پیامک: {item.sms_consent ? "رضایت ثبت شده" : "خیر"} · پذیرش حریم خصوصی و شرایط: {item.legal_consent ? "بله" : "خیر"}</p></details>
    </article>)}</div> : <div className="empty-state"><p>هنوز درخواست تماسی ثبت نشده است.</p></div>}
  </section></StaffLocalized>;
}
