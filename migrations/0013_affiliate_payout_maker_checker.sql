ALTER TABLE affiliate_payouts ADD COLUMN IF NOT EXISTS approved_by BIGINT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE affiliate_payouts ADD COLUMN IF NOT EXISTS paid_by BIGINT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE affiliate_payouts ADD COLUMN IF NOT EXISTS paid_reference_dedupe_enabled BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE affiliate_payouts SET approved_by=reviewed_by
WHERE status IN ('approved','paid') AND approved_by IS NULL;

WITH ranked AS (
  SELECT id,ROW_NUMBER() OVER(PARTITION BY paid_reference ORDER BY id) AS position
  FROM affiliate_payouts WHERE paid_reference IS NOT NULL
)
UPDATE affiliate_payouts p SET paid_reference_dedupe_enabled=TRUE
FROM ranked r WHERE r.id=p.id AND r.position=1;

CREATE UNIQUE INDEX IF NOT EXISTS affiliate_payout_paid_reference_uidx
  ON affiliate_payouts(paid_reference) WHERE paid_reference IS NOT NULL AND paid_reference_dedupe_enabled=TRUE;
