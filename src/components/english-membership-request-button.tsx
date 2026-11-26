"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EnglishMembershipRequestButton({ planId, authenticated, alreadyRequested, hasActiveMembership }: { planId: number; authenticated: boolean; alreadyRequested: boolean; hasActiveMembership: boolean }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  if (alreadyRequested) return <p className="gin-en-form-success">Your request is already pending review.</p>;

  async function request() {
    if (!authenticated) {
      router.push("/en/login?next=%2Fen%2Fportal-membership");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(hasActiveMembership ? "/api/membership/change" : "/api/membership/requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Your membership request could not be submitted.");
      setMessage(data.message || "Your request has been submitted.");
      router.refresh();
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Your membership request could not be submitted.");
    } finally {
      setBusy(false);
    }
  }

  return <div><button className="gin-en-button" onClick={request} disabled={busy}>{busy ? "Submitting…" : hasActiveMembership ? "Request this level" : "Request membership"}</button>{message && <p role="status">{message}</p>}</div>;
}
