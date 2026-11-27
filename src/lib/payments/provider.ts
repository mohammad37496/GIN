export type PaymentCurrency = string;

export type CheckoutRequest = {
  orderId: number;
  publicOrderId: string;
  amountMinor: number;
  currency: PaymentCurrency;
  returnUrl: string;
  idempotencyKey: string;
};

export type CheckoutSession = {
  providerReference: string;
  checkoutUrl: string;
  expiresAt: Date | null;
};

export type VerifiedWebhook = {
  eventId: string;
  eventType: string;
  transactionReference: string;
  refundReference?: string;
  outcome: "succeeded" | "failed" | "canceled" | "refunded";
  amountMinor: number;
  currency: string;
};

export class InvalidWebhookSignatureError extends Error {
  constructor(message = "Payment webhook signature is invalid") {
    super(message);
    this.name = "InvalidWebhookSignatureError";
  }
}

export class PaymentProviderUnavailableError extends Error {
  constructor(message = "Payment provider is temporarily unavailable") {
    super(message);
    this.name = "PaymentProviderUnavailableError";
  }
}

export interface PaymentProvider {
  readonly name: string;
  createCheckout(input: CheckoutRequest): Promise<CheckoutSession>;
  /** Throw InvalidWebhookSignatureError only for a bad signature; throw PaymentProviderUnavailableError for transient provider/infrastructure failures. */
  verifyWebhook(request: Request, rawBody: string): Promise<VerifiedWebhook>;
}

/** Provider adapters are deliberately opt-in. No gateway is enabled by default. */
export function getConfiguredPaymentProvider(): PaymentProvider | null {
  const provider = process.env.PAYMENT_PROVIDER?.trim().toLowerCase();
  if (!provider) return null;
  // A provider is not returned until a reviewed adapter is installed and configured.
  if (provider === "stripe" || provider === "zarinpal") return null;
  return null;
}

export function paymentProviderStatus() {
  return {
    selectedProvider: process.env.PAYMENT_PROVIDER?.trim().toLowerCase() || null,
    enabled: getConfiguredPaymentProvider() !== null,
    supportedAdapters: ["stripe", "zarinpal"],
  };
}
