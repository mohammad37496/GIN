ALTER TABLE course_enrollments
  ADD COLUMN IF NOT EXISTS source_order_id BIGINT REFERENCES orders(id) ON DELETE RESTRICT;

ALTER TABLE memberships
  ADD COLUMN IF NOT EXISTS source_order_id BIGINT REFERENCES orders(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS course_enrollments_source_order_idx
  ON course_enrollments(source_order_id) WHERE source_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS memberships_source_order_idx
  ON memberships(source_order_id) WHERE source_order_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS affiliate_wallet_commission_debit_uidx
  ON affiliate_wallet_entries(commission_id)
  WHERE commission_id IS NOT NULL AND entry_type='debit';
