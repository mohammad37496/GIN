# Local account email and password recovery

## Current behavior

- Local registration requires an email address and stores its trimmed lowercase form in `user_profiles.email`.
- The existing case-insensitive unique index prevents one email from being attached to multiple portal accounts.
- `email_verified_at` is nullable. Registration and profile email changes leave it null; changing only the letter case preserves an existing verification timestamp.
- Password-reset requests are eligible only for approved accounts with a verified email address.
- No transactional email provider is enabled. The provider factory deliberately returns `null`; the request endpoint responds with HTTP 503 and does not create a reset token. This is intentional and must not be presented as a successful email delivery.

## Reset-token security

- Tokens are generated from 32 cryptographically random bytes and encoded as URL-safe Base64.
- Only a SHA-256 digest is stored in `user_password_reset_tokens`; the raw token exists only long enough to pass to the email provider.
- Tokens expire after 30 minutes and only one unconsumed token per user is retained. Issuance locks the approved account row before invalidating older tokens, serializing concurrent requests.
- Consumption checks expiry and unused state in the same SQL update that changes the password hash and increments `users.token_version`. Concurrent submissions can succeed only once.
- Request and confirmation endpoints reject cross-origin mutations and fail closed when database-backed rate-limit state is unavailable. IP and normalized-email buckets are hashed before storage.
- A password change invalidates sessions carrying the previous token version; users must sign in again.

## Work still requiring an approved provider

The `EmailProvider` interface defines real email-verification and password-reset delivery contracts, but no provider adapter is selected or configured. Do not add Resend, another vendor, API keys, or sender configuration without explicit owner approval. Before enabling recovery in production, implement the email-verification token flow, provider adapter, delivery-failure handling and end-to-end verification with the selected service. Existing and newly registered email addresses remain unverified until that flow succeeds.

## Required production prerequisites

The current Vercel project has no observed `DATABASE_URL` or sufficiently long `SESSION_SECRET`; the production runtime consequently returns HTTP 503 for database-backed and session-protected operations. Provision the database and secret through the owner-controlled Vercel environment settings, then run migrations and verify authenticated production routes before enabling account recovery.
