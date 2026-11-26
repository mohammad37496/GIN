import { getConfiguredPaymentProvider, type VerifiedWebhook } from "@/lib/payments/provider";
import { processVerifiedPaymentWebhook } from "@/lib/payments/webhooks";
import { ensureSchema, inTransaction } from "@/lib/db";
import { errorResponse, jsonResponse } from "@/lib/http";
import { enforceRateLimit } from "@/lib/request-security";

export async function POST(request: Request, context: { params: Promise<{ provider: string }> }) {
  const limited = await enforceRateLimit(request, "payment-webhook", 120, 60);
  if (limited) return limited;
  const { provider: providerName } = await context.params;
  const provider = getConfiguredPaymentProvider();
  if (!provider || provider.name !== providerName) return errorResponse("درگاه پرداخت فعال نیست.", 503);

  let verified: VerifiedWebhook;
  try {
    const rawBody = await request.text();
    verified = await provider.verifyWebhook(request,rawBody);
  } catch {
    return errorResponse("امضای وب‌هوک پرداخت معتبر نیست.", 401);
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
