export type PasswordResetEmail = {
  to: string;
  resetUrl: string;
  expiresInMinutes: number;
  locale: "fa" | "en";
};

export type EmailVerificationEmail = {
  to: string;
  verificationUrl: string;
  expiresInMinutes: number;
  locale: "fa" | "en";
};

/**
 * Contract for a real transactional email integration.
 * A provider must reject on delivery/API failure; callers must never treat a
 * queued or failed provider request as a completed password reset.
 */
export interface EmailProvider {
  sendEmailVerificationEmail(message: EmailVerificationEmail): Promise<void>;
  sendPasswordResetEmail(message: PasswordResetEmail): Promise<void>;
}

/** No provider is enabled until the account owner selects and configures one. */
export function getConfiguredEmailProvider(): EmailProvider | null {
  return null;
}
