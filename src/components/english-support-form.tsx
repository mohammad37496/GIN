"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function EnglishSupportForm({ authenticated }: { authenticated: boolean }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!authenticated) {
      setError("Please sign in to send a portal support request.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/support/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Your request could not be sent.");
      setNotice(data.notice || "Your support request has been submitted.");
      setSubject("");
      setMessage("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your request could not be sent.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="gin-en-auth" aria-labelledby="gin-en-support-title">
      <h2 id="gin-en-support-title">Send a portal support request</h2>
      {authenticated ? (
        <form onSubmit={submit}>
          <label>Subject<input value={subject} onChange={(event) => setSubject(event.target.value)} required minLength={3} maxLength={180} /></label>
          <label>How can we help?<textarea value={message} onChange={(event) => setMessage(event.target.value)} required minLength={10} maxLength={10000} rows={5} /></label>
          {error && <p className="gin-en-form-error" role="alert">{error}</p>}
          {notice && <p className="gin-en-form-success" role="status">{notice}</p>}
          <button className="gin-en-button" disabled={busy}>{busy ? "Sending…" : "Send request"}</button>
        </form>
      ) : (
        <p>Sign in to send and track a portal support request. <Link href="/en/login?next=%2Fen%2Fsupport">Sign in to your account</Link>.</p>
      )}
    </section>
  );
}
