import { getConfiguredPaymentProvider, InvalidWebhookSignatureError, PaymentProviderUnavailableError, type VerifiedWebhook } from "@/lib/payments/provider";
import { processVerifiedPaymentWebhook } from "@/lib/payments/webhooks";
import { ensureSchema, inTransaction } from "@/lib/db";
import { errorResponse, jsonResponse } from "@/lib/http";
import { enforceRateLimit } from "@/lib/request-security";

export async function POST(request: Request, context: { params: Promise<{ provider: string }> }) {
  const { provider: providerName } = await context.params;
  const provider = getConfiguredPaymentProvider();
  if (!provider || provider.name !== providerName) return errorResponse("درگاه پرداخت فعال نیست.", 503);

  // The rate limiter is database-backed. enforceRateLimit fails closed with 503
  // when PostgreSQL is unavailable; do not let that infrastructure error escape
  // the route as an unhandled 500 or silently skip the security limit.
  const limited = await enforceRateLimit(request, "payment-webhook", 120, 60);
  if (limited) return limited;

  let verified: VerifiedWebhook;
  try {
    const rawBody = await request.text();
    verified = await provider.verifyWebhook(request,rawBody);
  } catch (error) {
    if (error instanceof InvalidWebhookSignatureError) return errorResponse("امضای وب‌هوک پرداخت معتبر نیست.", 401);
    if (error instanceof PaymentProviderUnavailableError) {
      console.error("GIN payment provider webhook verification is unavailable", error);
      return errorResponse("اعتبارسنجی وب‌هوک موقتاً در دسترس نیست؛ درخواست باید دوباره ارسال شود.", 503);
    }
    console.error("GIN payment provider webhook verification failed unexpectedly", error);
    return errorResponse("اعتبارسنجی وب‌هوک موقتاً در دسترس نیست؛ درخواست باید دوباره ارسال شود.", 503);
  }

  try {
    await ensureSchema();
    const result = await inTransaction((client) => processVerifiedPaymentWebhook(client,provider.name,verified));
    if ("conflict" in result) return errorResponse("شناسه رویداد قبلاً با محتوای متفاوتی ثبت شده است.", 409);
    if ("duplicate" in result) return jsonResponse({ received: true, duplicate: true });
    if ("retryable" in result) return errorResponse("تراکنش هنوز در سامانه ثبت نشده است؛ ارسال مجدد وب‌هوک لازم است.", 503);
    if ("mismatch" in result) return errorResponse("مبلغ یا ارز پرداخت با تراکنش ثبت‌شده مطابقت ندارد.", 400);
    if ("invalidTransition" in result) return jsonResponse({ received: true, ignored: true });
    return jsonResponse({ received: true, ...result });
  } catch {
    return errorResponse("پردازش وب‌هوک موقتاً در دسترس نیست؛ درخواست باید دوباره ارسال شود.", 503);
  }
}
