"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { englishContent } from "@/lib/bilingual-content";
import { localizedAssessmentApiError } from "@/lib/assessment-messages";

type Locale = "fa" | "en";
type Option = { id: string; label?: string; label_en?: string };
type Question = { id: number; question_type: "single_choice" | "multiple_choice" | "true_false" | "short_text"; prompt: string; prompt_en?: string | null; options: Option[]; points: number; position: number };
type Assessment = { id: number; title: string; title_en?: string | null; description: string; description_en?: string | null; time_limit_seconds: number; max_attempts: number; pass_percent: number };
type AttemptHistory = { attempt_number: number; status: "in_progress" | "submitted" | "graded" | "expired"; submitted_at?: string | null; score_percent?: number | null; passed?: boolean | null };

export default function AssessmentAttempt({ assessmentId, locale }: { assessmentId: number; locale: Locale }) {
  const english = locale === "en";
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string | boolean | string[]>>({});
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [dueAt, setDueAt] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [attemptHistory, setAttemptHistory] = useState<AttemptHistory[]>([]);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<{ status: string; scorePercent: number; passed: boolean | null; requiresManualGrade: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const t = useCallback((fa: string, en: string) => english ? en : fa, [english]);

  useEffect(() => {
    let active = true;
    fetch(`/api/assessments/${assessmentId}`).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(response.status === 401 ? t("برای مشاهده آزمون وارد شوید.", "Please sign in to view this assessment.") : t("آزمون در دسترس نیست یا ثبت‌نام شما فعال نیست.", "This assessment is unavailable or your course enrollment is inactive."));
      if (active) {
        setAssessment(data.assessment); setQuestions(data.questions); setRemaining(data.attemptsRemaining); setAttemptHistory(data.attemptHistory ?? []);
        if (data.activeAttempt) {
          setAttemptId(Number(data.activeAttempt.id)); setDueAt(data.activeAttempt.due_at ?? null);
          setAnswers(Object.fromEntries((data.activeAnswers ?? []).map((item: { question_id: number; answer: unknown }) => [Number(item.question_id), item.answer])));
        }
      }
    }).catch((error) => { if (active) setMessage(error instanceof Error ? error.message : t("دریافت آزمون انجام نشد.", "Could not load this assessment.")); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [assessmentId, t]);

  useEffect(() => {
    if (!dueAt) { setSecondsLeft(null); return; }
    const update = () => setSecondsLeft(Math.max(0, Math.ceil((new Date(dueAt).getTime() - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [dueAt]);

  useEffect(() => {
    if (!attemptId || Object.keys(answers).length === 0) return;
    const timer = window.setTimeout(() => {
      const savedAnswers = Object.entries(answers).map(([questionId, answer]) => ({ questionId: Number(questionId), answer }));
      saveQueue.current = saveQueue.current.catch(() => undefined).then(async () => {
        const response = await fetch(`/api/assessment-attempts/${attemptId}/answers`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers: savedAnswers }) });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          setMessage(localizedAssessmentApiError(locale, response.status, data.error, t("ذخیره پاسخ انجام نشد.", "Could not save your answers.")));
        }
      }).catch(() => { setMessage(t("ذخیره پاسخ انجام نشد؛ اتصال را بررسی کنید.", "Could not save your answer. Check your connection.")); });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [answers, attemptId, locale, t]);

  async function start() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/assessments/${assessmentId}/attempts`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(response.status === 409 ? t("تعداد تلاش‌های مجاز به پایان رسیده است.", "You have used all allowed attempts.") : t("شروع آزمون ممکن نشد.", "Could not start the assessment."));
      setAttemptId(Number(data.attempt.id)); setDueAt(data.attempt.due_at ?? null); setQuestions(data.questions); setAnswers({});
    } catch (error) { setMessage(error instanceof Error ? error.message : t("شروع آزمون ممکن نشد.", "Could not start the assessment.")); }
    finally { setBusy(false); }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (!attemptId) return;
    if (secondsLeft !== 0) {
      const incomplete = questions.find((question) => {
        const answer = answers[question.id];
        if (question.question_type === "multiple_choice") return !Array.isArray(answer) || answer.length === 0;
        if (question.question_type === "true_false") return typeof answer !== "boolean";
        return typeof answer !== "string" || answer.trim().length === 0;
      });
      if (incomplete) { setMessage(t("لطفاً به همه سؤال‌ها پاسخ دهید.", "Please answer every question before submitting.")); return; }
    }
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/assessment-attempts/${attemptId}/submit`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers: questions.map((question) => ({ questionId: question.id, answer: answers[question.id] ?? (question.question_type === "multiple_choice" ? [] : "") })) }) });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 409) {
          const refreshed = await fetch(`/api/assessments/${assessmentId}`, { cache: "no-store" });
          if (refreshed.ok) {
            const state = await refreshed.json();
            setAttemptId(state.activeAttempt ? Number(state.activeAttempt.id) : null);
            setDueAt(state.activeAttempt?.due_at ?? null);
            setAnswers(Object.fromEntries((state.activeAnswers ?? []).map((item: { question_id: number; answer: unknown }) => [Number(item.question_id), item.answer])));
            setAttemptHistory(state.attemptHistory ?? []);
            setRemaining(state.attemptsRemaining);
          }
        }
        throw new Error(response.status === 409 ? t("زمان آزمون به پایان رسیده یا تلاش قابل ارسال نیست.", "The time limit expired or this attempt can no longer be submitted.") : t("ثبت پاسخ‌ها انجام نشد. همه سؤال‌ها را بررسی کنید.", "Submission failed. Please check every answer and try again."));
      }
      setResult(data); setAttemptId(null); setDueAt(null);
      const refreshed = await fetch(`/api/assessments/${assessmentId}`, { cache: "no-store" });
      if (refreshed.ok) { const history = await refreshed.json(); setAttemptHistory(history.attemptHistory ?? []); setRemaining(history.attemptsRemaining); }
    } catch (error) { setMessage(error instanceof Error ? error.message : t("ثبت پاسخ‌ها انجام نشد.", "Submission failed.")); }
    finally { setBusy(false); }
  }

  function setAnswer(id: number, value: string | boolean | string[]) { setAnswers((current) => ({ ...current, [id]: value })); }
  function historyStatus(status: AttemptHistory["status"]) {
    if (status === "in_progress") return t("در حال انجام", "In progress");
    if (status === "submitted") return t("در انتظار ارزیابی مدرس", "Awaiting instructor review");
    if (status === "expired") return t("منقضی‌شده", "Expired");
    return t("ارزیابی‌شده", "Graded");
  }
  const dir = english ? "ltr" : "rtl";
  if (loading) return <section className="assessment-panel" dir={dir}><p>{t("در حال دریافت آزمون…", "Loading assessment…")}</p></section>;
  return <section className="assessment-panel" dir={dir}>
    {assessment && <><h1>{english ? englishContent(assessment.title_en) : assessment.title}</h1><p>{english ? englishContent(assessment.description_en) : assessment.description}</p><p>{t(`حداکثر تلاش: ${assessment.max_attempts} · حدنصاب: ${assessment.pass_percent}٪`, `Maximum attempts: ${assessment.max_attempts} · Passing score: ${assessment.pass_percent}%`)}{assessment.time_limit_seconds > 0 ? ` · ${t("زمان", "Time limit")}: ${Math.ceil(assessment.time_limit_seconds / 60)} ${t("دقیقه", "minutes")}` : ""}</p></>}
    {message && <p role="alert" className="assessment-message">{message}</p>}
    {attemptHistory.length > 0 && <section className="assessment-history" aria-label={t("سوابق تلاش‌ها", "Attempt history")}><h2>{t("سوابق تلاش‌ها", "Attempt history")}</h2>{attemptHistory.map((attempt) => <div key={attempt.attempt_number}><strong>{t("تلاش", "Attempt")} {attempt.attempt_number}</strong><span>{historyStatus(attempt.status)}</span>{attempt.status === "graded" && <span>{t("نمره", "Score")}: {Number(attempt.score_percent ?? 0)}% · {attempt.passed ? t("قبول", "Passed") : t("نیازمند تلاش مجدد", "Not passed")}</span>}</div>)}</section>}
    {result ? <div role="status"><h2>{result.requiresManualGrade ? t("پاسخ‌ها برای ارزیابی مدرس ارسال شد.", "Your answers were submitted for instructor review.") : result.passed ? t("آزمون را با موفقیت گذراندید.", "Assessment passed.") : t("حدنصاب آزمون کسب نشد.", "Assessment not passed.")}</h2><p>{t("نمره", "Score")}: {result.scorePercent}%</p></div> : !attemptId ? <><p>{remaining === null ? "" : t(`تلاش باقی‌مانده: ${remaining}`, `Attempts remaining: ${remaining}`)}</p><button type="button" disabled={busy || !assessment || remaining === 0} onClick={start}>{busy ? t("لطفاً صبر کنید…", "Please wait…") : t("شروع آزمون", "Start assessment")}</button></> : <form onSubmit={submit}>
      {secondsLeft !== null && <p className="assessment-countdown" role="timer">{secondsLeft > 0 ? `${t("زمان باقی‌مانده", "Time remaining")}: ${Math.floor(secondsLeft / 60).toString().padStart(2, "0")}:${(secondsLeft % 60).toString().padStart(2, "0")}` : t("زمان آزمون به پایان رسیده است؛ ارسال را انتخاب کنید تا تلاش بسته شود.", "Time is up. Submit to close this attempt.")}</p>}
      {questions.map((question, index) => <fieldset className="assessment-question" key={question.id}><legend>{index + 1}. {english ? englishContent(question.prompt_en) : question.prompt} <small>({question.points} {t("امتیاز", "points")})</small></legend>
        {question.question_type === "true_false" ? <div className="assessment-options">{[true, false].map((value) => <label key={String(value)}><input type="radio" name={`q-${question.id}`} checked={answers[question.id] === value} onChange={() => setAnswer(question.id, value)}/>{value ? t("درست", "True") : t("نادرست", "False")}</label>)}</div> : question.question_type === "short_text" ? <textarea aria-label={t("پاسخ تشریحی", "Your answer")} required rows={4} maxLength={2000} value={String(answers[question.id] ?? "")} onChange={(event) => setAnswer(question.id, event.target.value)} /> : <div className="assessment-options">{(question.options ?? []).map((option) => { const label = english ? englishContent(option.label_en) : option.label ?? ""; return <label key={option.id}><input type={question.question_type === "multiple_choice" ? "checkbox" : "radio"} name={`q-${question.id}`} checked={question.question_type === "multiple_choice" ? (Array.isArray(answers[question.id]) && (answers[question.id] as string[]).includes(option.id)) : answers[question.id] === option.id} onChange={(event) => { if (question.question_type === "multiple_choice") { const selected = Array.isArray(answers[question.id]) ? answers[question.id] as string[] : []; setAnswer(question.id, event.target.checked ? [...selected, option.id] : selected.filter((item) => item !== option.id)); } else setAnswer(question.id, option.id); }}/>{label}</label>; })}</div>}
      </fieldset>)}
      <button type="submit" disabled={busy}>{busy ? t("در حال ارسال…", "Submitting…") : t("ارسال پاسخ‌ها", "Submit answers")}</button>
    </form>}
  </section>;
}
