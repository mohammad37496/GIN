"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

export default function LessonProgressButton({ lessonId, durationSeconds, completed }: { lessonId: number; durationSeconds: number; completed: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
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
  return <div className="lesson-progress-action">{completed ? <span className="course-enrolled"><CheckCircle2 size={17}/> این درس تکمیل شده است</span> : <button className="button" onClick={markComplete} disabled={busy}>{busy ? "در حال ذخیره..." : "علامت‌گذاری به‌عنوان تکمیل‌شده"}<CheckCircle2 size={16}/></button>}{error && <small className="course-error">{error}</small>}</div>;
}
