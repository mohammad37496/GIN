import { errorResponse } from "@/lib/http";
import { isDatabaseUnavailableError } from "@/lib/db";
import { isSessionSecretConfigurationError } from "@/lib/auth";

type ApiHandler = (...args: never[]) => Response | Promise<Response>;

export function isApiInfrastructureError(error: unknown): boolean {
  return isDatabaseUnavailableError(error) || isSessionSecretConfigurationError(error);
}

export function withApiErrorBoundary<T extends ApiHandler>(handler: T): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      if (isApiInfrastructureError(error)) {
        console.error("GIN API dependency is unavailable", error);
        return errorResponse("سرویس به علت در دسترس نبودن پایگاه داده یا تنظیمات نشست موقتاً در دسترس نیست.", 503);
      }
      throw error;
    }
  }) as T;
}
