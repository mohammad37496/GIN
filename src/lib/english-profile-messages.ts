const profileErrorTranslations: Record<string, string> = {
  "ابتدا وارد شوید.": "Please sign in to manage your profile.",
  "دریافت پروفایل انجام نشد.": "Could not load your profile.",
  "اطلاعات پروفایل معتبر نیست.": "Your profile information is invalid.",
  "این ایمیل قبلاً برای حساب دیگری ثبت شده است.": "This email address is already in use by another account.",
  "ذخیره پروفایل انجام نشد.": "Could not save your profile.",
};

export function englishProfileError(serverMessage: unknown, fallback: string): string {
  if (typeof serverMessage !== "string") return fallback;
  return profileErrorTranslations[serverMessage] ?? fallback;
}
