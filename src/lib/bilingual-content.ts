export const TRANSLATION_PENDING = "Translation pending";

export function englishContent(value: unknown): string {
  return typeof value === "string" && value.trim() ? value : TRANSLATION_PENDING;
}
