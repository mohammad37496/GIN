import { errorResponse } from "@/lib/http";

const STORAGE_ERROR_NAMES = new Set([
  "AccessDenied",
  "AccessDeniedException",
  "CredentialsProviderError",
  "ExpiredToken",
  "ExpiredTokenException",
  "InternalError",
  "InvalidAccessKeyId",
  "InvalidIdentityToken",
  "NetworkingError",
  "NoSuchBucket",
  "PermanentRedirect",
  "RequestTimeout",
  "RequestTimeoutException",
  "ServiceUnavailable",
  "SignatureDoesNotMatch",
  "SlowDown",
  "Throttling",
  "ThrottlingException",
  "TimeoutError",
  "TokenProviderError",
  "VercelOidcError",
]);

const NETWORK_ERROR_CODES = new Set([
  "ECONNABORTED",
  "ECONNREFUSED",
  "ECONNRESET",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "ENOTFOUND",
  "ETIMEDOUT",
  "EAI_AGAIN",
]);

type StorageErrorMetadata = {
  name?: unknown;
  code?: unknown;
  Code?: unknown;
  message?: unknown;
  $metadata?: { httpStatusCode?: unknown };
};

function errorMetadata(error: unknown) {
  if (!error || typeof error !== "object") {
    return { errorName: "NonError", errorCode: null, httpStatusCode: null };
  }

  const candidate = error as StorageErrorMetadata;
  return {
    errorName: typeof candidate.name === "string" ? candidate.name : "UnknownError",
    errorCode: typeof candidate.code === "string"
      ? candidate.code
      : typeof candidate.Code === "string" ? candidate.Code : null,
    httpStatusCode: typeof candidate.$metadata?.httpStatusCode === "number"
      ? candidate.$metadata.httpStatusCode
      : null,
  };
}

export function isStorageProviderUnavailableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as StorageErrorMetadata;
  const name = typeof candidate.name === "string" ? candidate.name : "";
  const code = typeof candidate.code === "string"
    ? candidate.code
    : typeof candidate.Code === "string" ? candidate.Code : "";
  const status = typeof candidate.$metadata?.httpStatusCode === "number"
    ? candidate.$metadata.httpStatusCode
    : null;
  const message = typeof candidate.message === "string" ? candidate.message.toLowerCase() : "";

  return STORAGE_ERROR_NAMES.has(name)
    || STORAGE_ERROR_NAMES.has(code)
    || NETWORK_ERROR_CODES.has(code)
    || (status !== null && status >= 400 && status <= 599)
    || message.includes("vercel oidc token")
    || message.includes("assume role with web identity")
    || message.includes("credentials provider");
}

export function logStorageFailure(stage: "presign" | "completion" | "staging_cleanup", error: unknown) {
  // Never log object keys, request bodies, signed URLs, credentials, or raw messages.
  console.error("GIN storage provider operation failed", { stage, ...errorMetadata(error) });
}

export function mapStorageProviderError(
  stage: "presign" | "completion",
  error: unknown,
): Response | null {
  if (!isStorageProviderUnavailableError(error)) return null;
  logStorageFailure(stage, error);
  return errorResponse("فضای ذخیره‌سازی موقتاً در دسترس نیست؛ لطفاً دوباره تلاش کنید.", 503);
}
