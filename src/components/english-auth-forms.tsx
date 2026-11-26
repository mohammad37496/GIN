"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export function EnglishLoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to sign in.");
      document.cookie = `gin_locale=en; Path=/; Max-Age=31536000; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`;
      const next = new URLSearchParams(window.location.search).get("next");
      const englishDestinations: Record<string, string> = { "/dashboard": "/en/dashboard", "/admin": "/en/admin", "/instructor": "/en/instructor", "/events-manager": "/en/events-manager", "/finance-center": "/en/finance-center", "/support-center": "/en/support-center", "/affiliate": "/en/affiliate" };
      const destination = next?.startsWith("/en/") || next === "/en" ? next : englishDestinations[data.redirectTo] || data.redirectTo;
      window.location.assign(destination || "/en/dashboard");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to connect to the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="gin-en-auth">
      <h1>Member Login</h1>
      <p>Sign in to access your GIN portal account.</p>
      <form onSubmit={submit}>
        <label>Username<input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required minLength={3} maxLength={32} /></label>
        <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required maxLength={72} /></label>
        {error && <p className="gin-en-form-error" role="alert">{error}</p>}
        <button className="gin-en-button" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      </form>
      <div className="gin-en-auth-foot">New to this portal? <Link href="/en/register">Create a portal account</Link>.</div>
    </section>
  );
}

export function EnglishRegistrationForm({ headingLevel = "h1" }: { headingLevel?: "h1" | "h2" }) {
  const Heading = headingLevel;
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("The passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const referralCode = new URLSearchParams(window.location.search).get("ref")?.trim().toUpperCase();
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, ...(referralCode ? { referralCode } : {}) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Your request could not be submitted.");
      setDone(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to connect to the server.");
    } finally {
      setBusy(false);
    }
  }

  if (done) return <section className="gin-en-auth"><Heading>Request received</Heading><p className="gin-en-form-success" role="status">Your portal account request has been submitted. An administrator must approve the account before you can sign in.</p><Link className="gin-en-button" href="/en/login">Go to member login</Link></section>;

  return (
    <section className="gin-en-auth">
      <Heading>Create a Portal Account</Heading>
      <p>This creates an account for this learning portal. It is separate from an official GIN membership application.</p>
      <form onSubmit={submit}>
        <label>Username<input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required minLength={3} maxLength={32} pattern="[A-Za-z0-9_.-]+" /></label>
        <label>Password<input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={10} maxLength={72} /><small>Use at least 10 characters.</small></label>
        <label>Confirm password<input type="password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} required minLength={10} maxLength={72} /></label>
        {error && <p className="gin-en-form-error" role="alert">{error}</p>}
        <button className="gin-en-button" disabled={busy}>{busy ? "Submitting…" : "Submit account request"}</button>
      </form>
      <div className="gin-en-auth-foot">Applying for official GIN membership? <a href="https://signup.globalinformationnetwork.com/" target="_blank" rel="noreferrer">Open the official application</a>.</div>
    </section>
  );
}
