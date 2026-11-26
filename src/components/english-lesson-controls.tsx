"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function EnglishLessonProgressButton({ lessonId, durationSeconds, completed }: { lessonId: number; durationSeconds: number; completed: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [readyAt, setReadyAt] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const router = useRouter();

  const startTracking = useCallback(async () => {
    setError("");
    try {
      const response = await fetch(`/api/lessons/${lessonId}/progress`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "in_progress", watchedSeconds: 0, lastPositionSeconds: 0 }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not start lesson tracking.");
      const startedAt = new Date(data.startedAt).getTime();
      if (!Number.isFinite(startedAt)) throw new Error("The lesson start time is invalid.");
      setReadyAt(startedAt + Math.max(0, durationSeconds - 30) * 1000);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not start lesson tracking.");
    }
  }, [durationSeconds, lessonId]);

  useEffect(() => { if (!completed) void startTracking(); }, [completed, startTracking]);
  useEffect(() => {
    if (readyAt === null) return;
    const update = () => setRemainingSeconds(Math.max(0, Math.ceil((readyAt - Date.now()) / 1000)));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [readyAt]);

  async function markComplete() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/lessons/${lessonId}/progress`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "completed", watchedSeconds: durationSeconds, lastPositionSeconds: durationSeconds }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save lesson progress.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save lesson progress.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="gin-en-lesson-progress">{completed ? <p className="gin-en-form-success">This lesson is complete.</p> : <button className="gin-en-button" onClick={readyAt === null ? startTracking : markComplete} disabled={busy || (readyAt !== null && (remainingSeconds === null || remainingSeconds > 0))}>{busy ? "Saving…" : readyAt === null ? "Start lesson timer" : remainingSeconds === null || remainingSeconds > 0 ? `Time remaining: ${remainingSeconds ?? "…"} seconds` : "Mark lesson as complete"}</button>}{error && <p className="gin-en-form-error" role="alert">{error}</p>}</div>;
}

type Resource = { id: number; title: string; sizeBytes: number; url: string };

export function EnglishLessonResources({ lessonId }: { lessonId: number }) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    fetch(`/api/lessons/${lessonId}/resources`, { cache: "no-store" }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load lesson resources.");
      if (active) setResources(data.resources);
    }).catch((cause) => { if (active) setMessage(cause instanceof Error ? cause.message : "Could not load lesson resources."); });
    return () => { active = false; };
  }, [lessonId]);
  if (!resources.length && !message) return null;
  return <section className="gin-en-section"><h2>Lesson Resources</h2>{message && <p role="alert">{message}</p>}{resources.map((resource) => <p key={resource.id}><a href={resource.url} target="_blank" rel="noreferrer">{resource.title} ({Math.ceil(resource.sizeBytes / 1024)} KB)</a></p>)}</section>;
}
