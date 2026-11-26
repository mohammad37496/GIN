"use client";

import { useCallback, useEffect, useState } from "react";
import type { StaffLocale } from "@/components/staff-localization";
import { staffContent } from "@/components/staff-localization";

type Option = { id: string; label?: string; label_en?: string };
type Question = { id: number; prompt: string; prompt_en?: string | null; explanation_en?: string | null; options: Option[] };

export default function AdminAssessmentTranslations({ assessmentId, questionCount, titleEn, descriptionEn, locale }: { assessmentId: number; questionCount: number; titleEn?: string | null; descriptionEn?: string | null; locale: StaffLocale }) {
  const english = locale === "en";
  const [title, setTitle] = useState(titleEn ?? "");
  const [description, setDescription] = useState(descriptionEn ?? "");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const t = useCallback((fa: string, en: string) => english ? en : fa, [english]);
  const apiError = useCallback((value: string | undefined, fallback: string) => {
    if (!value || !english) return value ?? fallback;
    const messages: Record<string, string> = {
      "دسترسی غیرمجاز است.": "Access denied.", "آزمون پیدا نشد.": "Assessment not found.", "دسترسی مدیریت دوره ندارید.": "You do not have permission to manage this course.",
      "دریافت سؤال‌های آزمون انجام نشد.": "Could not load assessment questions.", "سؤال پیدا نشد.": "Question not found.", "شناسه سؤال معتبر نیست.": "Invalid question ID.",
      "ترجمه سؤال معتبر نیست.": "Invalid question translation.", "ذخیره ترجمه سؤال انجام نشد.": "Could not save the question translation.",
      "آزمون پیدا نشد یا وضعیت آن قابل ویرایش نیست.": "Assessment not found or cannot be edited in its current state.",
    };
    return messages[value] ?? fallback;
  }, [english]);

  const loadQuestions = useCallback(async () => {
    const response = await fetch(`/api/admin/assessments/${assessmentId}/questions`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(apiError(data.error, t("دریافت سؤال‌ها انجام نشد.", "Could not load questions.")));
    setQuestions(data.questions);
  }, [assessmentId, apiError, t]);

  useEffect(() => { void loadQuestions().catch((error) => setMessage(error instanceof Error ? error.message : t("دریافت سؤال‌ها انجام نشد.", "Could not load questions."))); }, [loadQuestions, questionCount, t]);

  async function saveAssessment() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/admin/assessments/${assessmentId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ titleEn: title, descriptionEn: description }) });
      const data = await response.json();
      if (!response.ok) throw new Error(apiError(data.error, t("ذخیره ترجمه آزمون انجام نشد.", "Could not save assessment translations.")));
      setMessage(t("ترجمه آزمون ذخیره شد.", "Assessment translation saved."));
    } catch (error) { setMessage(error instanceof Error ? error.message : t("ذخیره ترجمه آزمون انجام نشد.", "Could not save assessment translations.")); }
    finally { setBusy(false); }
  }

  async function saveQuestion(question: Question) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/admin/assessments/${assessmentId}/questions?questionId=${question.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ promptEn: question.prompt_en ?? "", explanationEn: question.explanation_en ?? "", optionTranslations: (question.options ?? []).map((option) => ({ id: option.id, labelEn: option.label_en ?? "" })) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(apiError(data.error, t("ذخیره ترجمه سؤال انجام نشد.", "Could not save question translations.")));
      setMessage(t("ترجمه سؤال ذخیره شد.", "Question translation saved."));
      await loadQuestions();
    } catch (error) { setMessage(error instanceof Error ? error.message : t("ذخیره ترجمه سؤال انجام نشد.", "Could not save question translations.")); }
    finally { setBusy(false); }
  }

  function updateQuestion(id: number, update: Partial<Question>) { setQuestions((current) => current.map((question) => question.id === id ? { ...question, ...update } : question)); }
  return <section className="admin-assessment-translations" dir={english ? "ltr" : "rtl"}>
    <h4>{t("ترجمه انگلیسی آزمون و سؤال‌ها", "English assessment and question translations")}</h4>
    <label>{t("عنوان انگلیسی آزمون", "English assessment title")}<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Translation pending" maxLength={180}/></label>
    <label>{t("توضیحات انگلیسی آزمون", "English assessment description")}<textarea rows={2} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Translation pending" maxLength={4000}/></label>
    <button type="button" className="refresh-button" disabled={busy} onClick={saveAssessment}>{t("ذخیره ترجمه آزمون", "Save assessment translation")}</button>
    {questions.map((question, index) => <article className="admin-assessment-translation-question" key={question.id}>
      <strong>{t("سؤال", "Question")} {index + 1}: {staffContent(question.prompt, question.prompt_en, locale)}</strong>
      <label>{t("متن انگلیسی سؤال", "English question prompt")}<textarea rows={2} value={question.prompt_en ?? ""} placeholder="Translation pending" onChange={(event) => updateQuestion(question.id, { prompt_en: event.target.value })}/></label>
      <label>{t("توضیح انگلیسی پاسخ", "English answer explanation")}<textarea rows={2} value={question.explanation_en ?? ""} placeholder="Translation pending" onChange={(event) => updateQuestion(question.id, { explanation_en: event.target.value })}/></label>
      {(question.options ?? []).map((option) => <label key={option.id}>{t("گزینه", "Option")} {option.id}: {staffContent(option.label ?? "", option.label_en, locale)}<input value={option.label_en ?? ""} placeholder="Translation pending" onChange={(event) => updateQuestion(question.id, { options: question.options.map((item) => item.id === option.id ? { ...item, label_en: event.target.value } : item) })}/></label>)}
      <button type="button" className="refresh-button" disabled={busy} onClick={() => saveQuestion(question)}>{t("ذخیره ترجمه سؤال", "Save question translation")}</button>
    </article>)}
    {message && <p role="status">{message}</p>}
  </section>;
}
