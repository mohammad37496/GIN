"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EnglishEventRegistrationButton({ slug, authenticated, status, accessType }: { slug: string; authenticated: boolean; status: string | null; accessType: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function act(action: "register" | "cancel") {
    if (!authenticated) {
      router.push(`/en/login?next=${encodeURIComponent(`/en/events/${slug}`)}`);
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/events/${encodeURIComponent(slug)}/${action}`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The event request could not be completed.");
      setMessage(data.message || "Your event registration has been updated.");
      router.refresh();
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "The event request could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  if (accessType === "paid") return <p className="gin-en-form-error">Paid event registration is unavailable until online payments are configured.</p>;
  if (status === "registered" || status === "attended") return <div><p className="gin-en-form-success">Your registration is active.</p><button className="gin-en-button gin-en-button-alt" disabled={busy} onClick={() => act("cancel")}>Cancel registration</button>{message && <p role="status">{message}</p>}</div>;
  if (status === "waitlisted") return <p className="gin-en-form-success">You are on the event waiting list.</p>;
  return <div><button className="gin-en-button" disabled={busy} onClick={() => act("register")}>{busy ? "Submitting…" : accessType === "members" ? "Register with eligible membership" : authenticated ? "Register for this event" : "Sign in to register"}</button>{message && <p role="status">{message}</p>}</div>;
}
