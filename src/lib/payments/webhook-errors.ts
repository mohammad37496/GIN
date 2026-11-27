import { errorResponse } from "@/lib/http";
import { isDatabaseUnavailableError } from "@/lib/db";

function failureMetadata(error: unknown) {
  if (!error || typeof error !== "object") {
    return { errorName: "NonError", errorCode: null };
  }

  const candidate = error as { name?: unknown; code?: unknown };
  return {
    errorName: typeof candidate.name === "string" ? candidate.name : "UnknownError",
    errorCode: typeof candidate.code === "string" ? candidate.code : null,
  };
}

export function logWebhookFailure(stage: "verification" | "processing", error: unknown) {
  // Do not log request bodies, signatures, credentials, provider response bodies,
  // or raw exception messages that may contain connection strings or secrets.
  console.error("GIN payment webhook failed", {
    stage,
    category: isDatabaseUnavailableError(error) ? "database_unavailable" : "unexpected",
    ...failureMetadata(error),
  });
}

export function mapWebhookProcessingError(error: unknown): Response | null {
  if (!isDatabaseUnavailableError(error)) return null;
  logWebhookFailure("processing", error);
  return errorResponse("پردازش وب‌هوک موقتاً در دسترس نیست؛ درخواست باید دوباره ارسال شود.", 503);
}
