"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { englishProfileError } from "@/lib/english-profile-messages";

type Profile = { display_name: string | null; email: string | null; phone: string | null; locale: "fa" | "en"; timezone: string };

export function EnglishProfileForm() {
  const [profile, setProfile] = useState<Profile>({ display_name: "", email: "", phone: "", locale: "en", timezone: "Asia/Tehran" });
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/profile", { cache: "no-store" }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(englishProfileError(data.error, "Could not load your profile."));
      if (active && data.profile) setProfile(data.profile);
    }).catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Could not load your profile."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ displayName: profile.display_name ?? "", email: profile.email ?? "", phone: profile.phone ?? "", locale: profile.locale, timezone: profile.timezone || "Asia/Tehran" }) });
      const data = await response.json();
      if (!response.ok) throw new Error(englishProfileError(data.error, "Could not save your profile."));
      document.cookie = `gin_locale=${profile.locale}; Path=/; Max-Age=31536000; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`;
      setNotice("Your profile has been saved. Your language preference will be used on future visits.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save your profile.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p aria-live="polite">Loading your profile…</p>;
  return <form className="gin-en-auth" onSubmit={submit}>
    <h1>Account Profile</h1>
    <label>Display name<input value={profile.display_name ?? ""} onChange={(event) => setProfile({ ...profile, display_name: event.target.value })} maxLength={120} /></label>
    <label>Email address<input type="email" value={profile.email ?? ""} onChange={(event) => setProfile({ ...profile, email: event.target.value })} maxLength={254} /></label>
    <label>Phone number<input value={profile.phone ?? ""} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} maxLength={40} /></label>
    <label>Preferred language<select value={profile.locale} onChange={(event) => setProfile({ ...profile, locale: event.target.value as "fa" | "en" })}><option value="en">English</option><option value="fa">Persian</option></select></label>
    <label>Time zone<input value={profile.timezone} onChange={(event) => setProfile({ ...profile, timezone: event.target.value })} required maxLength={80} /></label>
    {error && <p className="gin-en-form-error" role="alert">{error}</p>}
    {notice && <p className="gin-en-form-success" role="status">{notice}</p>}
    <button className="gin-en-button" disabled={busy}>{busy ? "Saving…" : "Save profile"}</button>
    <p><Link href="/en/dashboard">Back to dashboard</Link></p>
  </form>;
}

export function EnglishLogoutButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function logout() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/logout?locale=en", { method: "POST" });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        setError(result.error_en || "The server could not revoke this session. Please try again.");
        setBusy(false);
        return;
      }
      window.location.assign("/en");
    } catch {
      setError("The server could not revoke this session. Please try again.");
      setBusy(false);
    }
  }
  return <>
    <button className="gin-en-button gin-en-button-alt" onClick={logout} disabled={busy}>{busy ? "Signing out…" : "Sign out"}</button>
    {error && <p className="gin-en-form-error" role="alert">{error}</p>}
  </>;
}
