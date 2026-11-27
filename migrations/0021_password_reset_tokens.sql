ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS user_password_reset_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_password_reset_tokens_user_created_idx
  ON user_password_reset_tokens(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS user_password_reset_tokens_expiry_idx
  ON user_password_reset_tokens(expires_at)
  WHERE consumed_at IS NULL;
