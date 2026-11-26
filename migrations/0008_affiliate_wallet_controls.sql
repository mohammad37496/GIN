ALTER TABLE affiliate_payouts ADD COLUMN IF NOT EXISTS paid_reference VARCHAR(180);
CREATE UNIQUE INDEX IF NOT EXISTS affiliate_wallet_commission_credit_uidx
  ON affiliate_wallet_entries(commission_id) WHERE commission_id IS NOT NULL AND entry_type='credit';
CREATE UNIQUE INDEX IF NOT EXISTS affiliate_wallet_payout_debit_uidx
  ON affiliate_wallet_entries(payout_id) WHERE payout_id IS NOT NULL AND entry_type='debit';

CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id BIGSERIAL PRIMARY KEY,
  affiliate_id BIGINT NOT NULL REFERENCES affiliate_accounts(id) ON DELETE RESTRICT,
  visitor_hash VARCHAR(64) NOT NULL,
  landing_path VARCHAR(500) NOT NULL DEFAULT '/',
  visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS affiliate_clicks_affiliate_date_idx ON affiliate_clicks(affiliate_id,visited_at DESC);

CREATE TABLE IF NOT EXISTS payment_provider_configs (
  provider VARCHAR(40) PRIMARY KEY,
  is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  public_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
