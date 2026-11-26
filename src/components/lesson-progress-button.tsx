"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

export default function LessonProgressButton({ lessonId, durationSeconds, completed }: { lessonId: number; durationSeconds: number; completed: boolean }) {
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
      if (!response.ok) throw new Error(data.error || "ثبت شروع درس ناموفق بود.");
      const startedAt = new Date(data.startedAt).getTime();
      if (!Number.isFinite(startedAt)) throw new Error("زمان شروع درس معتبر نیست.");
      setReadyAt(startedAt + Math.max(0, durationSeconds - 30) * 1000);
    } catch (e) { setError(e instanceof Error ? e.message : "ثبت شروع درس ناموفق بود."); }
  }, [durationSeconds, lessonId]);
  useEffect(() => {
    if (!completed) void startTracking();
  }, [completed, startTracking]);
  useEffect(() => {
    if (readyAt === null) return;
    const updateRemaining = () => setRemainingSeconds(Math.max(0, Math.ceil((readyAt - Date.now()) / 1000)));
    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, [readyAt]);
  async function markComplete() {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/lessons/${lessonId}/progress`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "completed", watchedSeconds: durationSeconds, lastPositionSeconds: durationSeconds }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "ذخیره پیشرفت ناموفق بود.");
      router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "خطا در ذخیره پیشرفت"); }
    finally { setBusy(false); }
  }
  return <div className="lesson-progress-action">{completed ? <span className="course-enrolled"><CheckCircle2 size={17}/> این درس تکمیل شده است</span> : <><button className="button" onClick={readyAt === null ? startTracking : markComplete} disabled={busy || (readyAt !== null && (remainingSeconds === null || remainingSeconds > 0))}>{busy ? "در حال ذخیره..." : readyAt === null ? "شروع ثبت زمان درس" : remainingSeconds === null || remainingSeconds > 0 ? `زمان لازم برای تکمیل: ${remainingSeconds ?? "..."} ثانیه` : "علامت‌گذاری به‌عنوان تکمیل‌شده"}<CheckCircle2 size={16}/></button></>}{error && <small className="course-error">{error}</small>}</div>;
}
