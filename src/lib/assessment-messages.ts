export type AssessmentLocale = "fa" | "en";

export function localizedAssessmentApiError(
  locale: AssessmentLocale,
  status: number,
  serverMessage: unknown,
  fallback: string,
): string {
  if (locale === "fa" && typeof serverMessage === "string" && serverMessage.trim()) return serverMessage;
  if (status === 401) return locale === "en" ? "Please sign in to continue this assessment." : "برای ادامه آزمون وارد شوید.";
  if (status === 403) return locale === "en" ? "Your active enrollment is required to continue this assessment." : "برای ادامه آزمون به ثبت‌نام فعال در دوره نیاز دارید.";
  if (status === 409) return locale === "en" ? "The assessment attempt has expired or is no longer available." : "زمان آزمون به پایان رسیده یا این تلاش دیگر در دسترس نیست.";
  return fallback;
}
