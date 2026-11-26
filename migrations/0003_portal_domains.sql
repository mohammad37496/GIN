-- Assessment and certification
CREATE TABLE IF NOT EXISTS assessments (
  id BIGSERIAL PRIMARY KEY,
  course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id BIGINT REFERENCES lessons(id) ON DELETE CASCADE,
  title VARCHAR(180) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status VARCHAR(12) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  time_limit_seconds INTEGER NOT NULL DEFAULT 0 CHECK (time_limit_seconds BETWEEN 0 AND 86400),
  max_attempts INTEGER NOT NULL DEFAULT 1 CHECK (max_attempts BETWEEN 1 AND 100),
  pass_percent NUMERIC(5,2) NOT NULL DEFAULT 70 CHECK (pass_percent BETWEEN 0 AND 100),
  shuffle_questions BOOLEAN NOT NULL DEFAULT FALSE,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS assessments_course_status_idx ON assessments(course_id,status);

CREATE TABLE IF NOT EXISTS assessment_questions (
  id BIGSERIAL PRIMARY KEY,
  assessment_id BIGINT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('single_choice','multiple_choice','true_false','short_text')),
  prompt TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(options)='array'),
  answer_key JSONB NOT NULL DEFAULT 'null'::jsonb,
  explanation TEXT NOT NULL DEFAULT '',
  points NUMERIC(8,2) NOT NULL DEFAULT 1 CHECK (points > 0),
  position INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(assessment_id,position)
);

CREATE TABLE IF NOT EXISTS assessment_attempts (
  id BIGSERIAL PRIMARY KEY,
  assessment_id BIGINT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL CHECK (attempt_number > 0),
  status VARCHAR(14) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','submitted','graded','expired')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  score_percent NUMERIC(5,2) CHECK (score_percent BETWEEN 0 AND 100),
  passed BOOLEAN,
  graded_at TIMESTAMPTZ,
  UNIQUE(assessment_id,user_id,attempt_number)
);
CREATE INDEX IF NOT EXISTS assessment_attempts_user_idx ON assessment_attempts(user_id,started_at DESC);

CREATE TABLE IF NOT EXISTS assessment_answers (
  id BIGSERIAL PRIMARY KEY,
  attempt_id BIGINT NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
  question_id BIGINT NOT NULL REFERENCES assessment_questions(id) ON DELETE CASCADE,
  answer JSONB NOT NULL,
  is_correct BOOLEAN,
  points_awarded NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (points_awarded >= 0),
  feedback TEXT NOT NULL DEFAULT '',
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(attempt_id,question_id)
);

CREATE TABLE IF NOT EXISTS certificates (
  id BIGSERIAL PRIMARY KEY,
  public_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  serial_number VARCHAR(48) NOT NULL UNIQUE,
  course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  enrollment_id BIGINT NOT NULL UNIQUE REFERENCES course_enrollments(id) ON DELETE RESTRICT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  revoke_reason TEXT
);
CREATE INDEX IF NOT EXISTS certificates_user_idx ON certificates(user_id,issued_at DESC);

-- Membership, plans and entitlement grants
CREATE TABLE IF NOT EXISTS membership_plans (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(60) NOT NULL UNIQUE,
  name VARCHAR(140) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  level INTEGER NOT NULL DEFAULT 0 CHECK (level >= 0),
  price_minor BIGINT NOT NULL DEFAULT 0 CHECK (price_minor >= 0),
  currency VARCHAR(3),
  billing_interval VARCHAR(12) NOT NULL DEFAULT 'none' CHECK (billing_interval IN ('none','month','year')),
  benefits JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(benefits)='array'),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((price_minor=0 AND currency IS NULL AND billing_interval='none') OR (price_minor>0 AND currency ~ '^[A-Z]{3}$' AND billing_interval IN ('month','year')))
);

CREATE TABLE IF NOT EXISTS membership_plan_courses (
  plan_id BIGINT NOT NULL REFERENCES membership_plans(id) ON DELETE CASCADE,
  course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  PRIMARY KEY(plan_id,course_id)
);

CREATE TABLE IF NOT EXISTS memberships (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  plan_id BIGINT NOT NULL REFERENCES membership_plans(id) ON DELETE RESTRICT,
  status VARCHAR(14) NOT NULL CHECK (status IN ('pending','active','past_due','canceled','expired')),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  provider VARCHAR(40),
  provider_subscription_id VARCHAR(180),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);
CREATE UNIQUE INDEX IF NOT EXISTS memberships_provider_subscription_uidx ON memberships(provider,provider_subscription_id) WHERE provider_subscription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS memberships_user_status_idx ON memberships(user_id,status,ends_at DESC);

-- Orders and provider-neutral payment ledger; no provider is enabled by this migration.
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  public_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status VARCHAR(14) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','canceled','refunded','expired')),
  currency VARCHAR(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  subtotal_minor BIGINT NOT NULL CHECK (subtotal_minor >= 0),
  discount_minor BIGINT NOT NULL DEFAULT 0 CHECK (discount_minor >= 0),
  total_minor BIGINT NOT NULL CHECK (total_minor >= 0),
  idempotency_key VARCHAR(160) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  UNIQUE(user_id,idempotency_key),
  CHECK (total_minor=subtotal_minor-discount_minor)
);
CREATE INDEX IF NOT EXISTS orders_user_created_idx ON orders(user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('membership','course','event')),
  item_id BIGINT NOT NULL,
  title_snapshot VARCHAR(180) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_amount_minor BIGINT NOT NULL CHECK (unit_amount_minor >= 0),
  total_amount_minor BIGINT NOT NULL CHECK (total_amount_minor >= 0)
);

CREATE TABLE IF NOT EXISTS payment_transactions (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  provider VARCHAR(40) NOT NULL,
  provider_reference VARCHAR(180),
  idempotency_key VARCHAR(160) NOT NULL UNIQUE,
  status VARCHAR(16) NOT NULL DEFAULT 'created' CHECK (status IN ('created','pending','authorized','succeeded','failed','canceled','refunded')),
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  currency VARCHAR(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  provider_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  succeeded_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS payment_transactions_provider_ref_uidx ON payment_transactions(provider,provider_reference) WHERE provider_reference IS NOT NULL;
CREATE INDEX IF NOT EXISTS payment_transactions_order_idx ON payment_transactions(order_id,created_at DESC);

CREATE TABLE IF NOT EXISTS invoices (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
  invoice_number VARCHAR(48) NOT NULL UNIQUE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  billing_details JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS payment_webhook_events (
  id BIGSERIAL PRIMARY KEY,
  provider VARCHAR(40) NOT NULL,
  provider_event_id VARCHAR(180) NOT NULL,
  event_type VARCHAR(120) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(14) NOT NULL DEFAULT 'received' CHECK (status IN ('received','processed','failed','ignored')),
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  UNIQUE(provider,provider_event_id)
);

-- Events and capacity-controlled registrations
CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  slug VARCHAR(120) NOT NULL UNIQUE,
  title VARCHAR(180) NOT NULL,
  summary VARCHAR(360) NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  location VARCHAR(240) NOT NULL DEFAULT '',
  meeting_url TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  capacity INTEGER CHECK (capacity IS NULL OR capacity >= 0),
  access_type VARCHAR(12) NOT NULL DEFAULT 'public' CHECK (access_type IN ('public','members','paid')),
  price_minor BIGINT NOT NULL DEFAULT 0 CHECK (price_minor >= 0),
  currency VARCHAR(3),
  status VARCHAR(12) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','canceled','completed')),
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (ends_at>starts_at),
  CHECK ((access_type IN ('public','members') AND price_minor=0 AND currency IS NULL) OR (access_type='paid' AND price_minor>0 AND currency ~ '^[A-Z]{3}$'))
);
CREATE INDEX IF NOT EXISTS events_status_start_idx ON events(status,starts_at);

CREATE TABLE IF NOT EXISTS event_registrations (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status VARCHAR(12) NOT NULL DEFAULT 'registered' CHECK (status IN ('registered','waitlisted','canceled','attended','no_show')),
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  canceled_at TIMESTAMPTZ,
  order_id BIGINT REFERENCES orders(id) ON DELETE RESTRICT,
  UNIQUE(event_id,user_id)
);
CREATE INDEX IF NOT EXISTS event_registrations_event_status_idx ON event_registrations(event_id,status,registered_at);

-- Referral attribution, commission ledger and payout workflow
CREATE TABLE IF NOT EXISTS affiliate_accounts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
  referral_code VARCHAR(32) NOT NULL UNIQUE,
  status VARCHAR(12) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referral_attributions (
  id BIGSERIAL PRIMARY KEY,
  affiliate_id BIGINT NOT NULL REFERENCES affiliate_accounts(id) ON DELETE RESTRICT,
  referred_user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
  referral_code VARCHAR(32) NOT NULL,
  attributed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (affiliate_id <> referred_user_id)
);

CREATE TABLE IF NOT EXISTS commission_rules (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('membership','course','event')),
  rate_basis_points INTEGER NOT NULL CHECK (rate_basis_points BETWEEN 0 AND 10000),
  fixed_minor BIGINT NOT NULL DEFAULT 0 CHECK (fixed_minor >= 0),
  currency VARCHAR(3),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id BIGSERIAL PRIMARY KEY,
  affiliate_id BIGINT NOT NULL REFERENCES affiliate_accounts(id) ON DELETE RESTRICT,
  referred_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  order_item_id BIGINT NOT NULL REFERENCES order_items(id) ON DELETE RESTRICT,
  rule_id BIGINT REFERENCES commission_rules(id) ON DELETE SET NULL,
  amount_minor BIGINT NOT NULL CHECK (amount_minor >= 0),
  currency VARCHAR(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  status VARCHAR(12) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','available','paid','reversed','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(order_item_id,affiliate_id)
);
CREATE INDEX IF NOT EXISTS affiliate_commissions_affiliate_idx ON affiliate_commissions(affiliate_id,status,created_at DESC);

CREATE TABLE IF NOT EXISTS affiliate_payouts (
  id BIGSERIAL PRIMARY KEY,
  affiliate_id BIGINT NOT NULL REFERENCES affiliate_accounts(id) ON DELETE RESTRICT,
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  currency VARCHAR(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  status VARCHAR(12) NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','approved','rejected','paid')),
  payout_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS affiliate_wallet_entries (
  id BIGSERIAL PRIMARY KEY,
  affiliate_id BIGINT NOT NULL REFERENCES affiliate_accounts(id) ON DELETE RESTRICT,
  commission_id BIGINT REFERENCES affiliate_commissions(id) ON DELETE RESTRICT,
  payout_id BIGINT REFERENCES affiliate_payouts(id) ON DELETE RESTRICT,
  entry_type VARCHAR(12) NOT NULL CHECK (entry_type IN ('credit','debit','reversal')),
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  currency VARCHAR(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS affiliate_wallet_entries_affiliate_idx ON affiliate_wallet_entries(affiliate_id,created_at DESC);

-- Track uploaded objects separately from public URL presentation.
CREATE TABLE IF NOT EXISTS stored_assets (
  id BIGSERIAL PRIMARY KEY,
  owner_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  object_key TEXT NOT NULL UNIQUE,
  original_filename VARCHAR(180) NOT NULL,
  content_type VARCHAR(120) NOT NULL,
  size_bytes BIGINT NOT NULL CHECK (size_bytes>0),
  status VARCHAR(12) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','ready','quarantined','deleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS stored_assets_owner_idx ON stored_assets(owner_id,created_at DESC);

-- Audit detail is intentionally JSONB and contains no credentials or payment secrets.
CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON audit_logs(action,created_at DESC);
