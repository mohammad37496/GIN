export type CourseAccess = "free" | "members" | "paid";

export function getWorkspacePath(primaryRole: "user" | "admin", roles: readonly string[]): string {
  if (primaryRole === "admin") return "/admin";
  if (roles.includes("finance") || roles.includes("affiliate_manager")) return "/finance-center";
  if (roles.includes("support")) return "/support-center";
  if (roles.includes("event_manager")) return "/events-manager";
  if (roles.includes("instructor")) return "/instructor";
  return "/dashboard";
}

export function canOpenLesson(input: { isPreview: boolean; isEnrolled: boolean }): boolean {
  return input.isPreview || input.isEnrolled;
}

export function safeInternalPath(value: string | null, fallback: string): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || /[\u0000-\u001f]/.test(value)) return fallback;
  try {
    const decoded = decodeURIComponent(value);
    if (/[\u0000-\u001f\u007f\\]/.test(decoded) || decoded.startsWith("//")) return fallback;
    const parsed = new URL(value, "https://gin.invalid");
    if (parsed.origin !== "https://gin.invalid") return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function canEnrollWithoutPayment(access: CourseAccess): boolean {
  return access === "free";
}

export function isValidCompletionPosition(input: { durationSeconds: number; watchedSeconds: number; lastPositionSeconds: number }): boolean {
  if (![input.durationSeconds, input.watchedSeconds, input.lastPositionSeconds].every(Number.isSafeInteger)) return false;
  if (input.durationSeconds < 0 || input.watchedSeconds < 0 || input.lastPositionSeconds < 0) return false;
  const ceiling = Math.max(input.durationSeconds, 30);
  return input.watchedSeconds <= ceiling && input.lastPositionSeconds <= ceiling;
}

export function gradeChoiceAnswer(type: "single_choice" | "multiple_choice" | "true_false", expected: unknown, submitted: unknown): boolean {
  if (type === "multiple_choice") {
    if (!Array.isArray(expected) || !Array.isArray(submitted)) return false;
    const left = [...new Set(expected.map(String))].sort();
    const right = [...new Set(submitted.map(String))].sort();
    return left.length === right.length && left.every((value, index) => value === right[index]);
  }
  return typeof expected === typeof submitted && String(expected) === String(submitted);
}

export function isAllowedPaymentTransition(from: string, to: string): boolean {
  const transitions: Record<string, string[]> = {
    created: ["pending", "failed", "canceled"],
    pending: ["authorized", "succeeded", "failed", "canceled", "expired"],
    authorized: ["succeeded", "failed", "canceled"],
    succeeded: ["refunded"],
    failed: [],
    canceled: [],
    expired: [],
    refunded: [],
  };
  return transitions[from]?.includes(to) ?? false;
}

export function calculateCommission(amountMinor: number, rateBasisPoints: number, fixedMinor: number): number {
  if (![amountMinor, rateBasisPoints, fixedMinor].every(Number.isSafeInteger) || amountMinor < 0 || rateBasisPoints < 0 || rateBasisPoints > 10_000 || fixedMinor < 0) throw new RangeError("Invalid commission inputs");
  return Math.min(amountMinor, Math.floor((amountMinor * rateBasisPoints) / 10_000) + fixedMinor);
}
