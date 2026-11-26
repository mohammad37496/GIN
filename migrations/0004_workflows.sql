ALTER TABLE memberships ADD COLUMN IF NOT EXISTS source VARCHAR(12) NOT NULL DEFAULT 'admin';
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS created_by BIGINT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ;
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='memberships_source_check' AND conrelid='memberships'::regclass) THEN
    ALTER TABLE memberships ADD CONSTRAINT memberships_source_check CHECK (source IN ('admin','payment','migration'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS membership_requests (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  plan_id BIGINT NOT NULL REFERENCES membership_plans(id) ON DELETE RESTRICT,
  status VARCHAR(12) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','withdrawn')),
  message TEXT NOT NULL DEFAULT '',
  reviewed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS membership_requests_one_pending_uidx ON membership_requests(user_id,plan_id) WHERE status='pending';
CREATE INDEX IF NOT EXISTS membership_requests_status_idx ON membership_requests(status,created_at DESC);

CREATE TABLE IF NOT EXISTS course_enrollment_events (
  id BIGSERIAL PRIMARY KEY,
  enrollment_id BIGINT NOT NULL REFERENCES course_enrollments(id) ON DELETE RESTRICT,
  actor_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('enrolled','revoked','reactivated','completed','expired','admin_grant')),
  previous_status VARCHAR(12),
  next_status VARCHAR(12) NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS course_enrollment_events_history_idx ON course_enrollment_events(enrollment_id,created_at DESC);

CREATE TABLE IF NOT EXISTS payment_refunds (
  id BIGSERIAL PRIMARY KEY,
  payment_transaction_id BIGINT NOT NULL REFERENCES payment_transactions(id) ON DELETE RESTRICT,
  provider_refund_id VARCHAR(180),
  amount_minor BIGINT NOT NULL CHECK (amount_minor>0),
  currency VARCHAR(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  status VARCHAR(12) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','succeeded','failed')),
  reason TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(payment_transaction_id,provider_refund_id)
);
