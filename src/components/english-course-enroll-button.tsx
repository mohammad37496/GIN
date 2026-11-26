"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EnglishCourseEnrollButton({ slug, authenticated, enrolled, accessType }: { slug: string; authenticated: boolean; enrolled: boolean; accessType: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  if (enrolled) return <span className="gin-en-form-success">You are enrolled in this course.</span>;
  if (accessType === "paid") return <span className="gin-en-form-error">Online purchase is unavailable until a payment provider is configured.</span>;

  async function enroll() {
    if (!authenticated) {
      router.push(`/en/login?next=${encodeURIComponent(`/en/courses/${slug}`)}`);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/courses/${encodeURIComponent(slug)}/enroll`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Enrollment could not be completed.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Enrollment could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  return <div><button className="gin-en-button" onClick={enroll} disabled={busy}>{busy ? "Enrolling…" : accessType === "members" ? "Enroll with active membership" : "Enroll for free"}</button>{error && <p className="gin-en-form-error" role="alert">{error}</p>}</div>;
}
