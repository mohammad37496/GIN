CREATE TABLE IF NOT EXISTS contact_submissions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80) NOT NULL,
  email VARCHAR(254) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  address_line1 VARCHAR(180) NOT NULL,
  address_line2 VARCHAR(180),
  city VARCHAR(100) NOT NULL,
  state_region VARCHAR(100) NOT NULL,
  postal_code VARCHAR(24) NOT NULL,
  country VARCHAR(100) NOT NULL,
  preferred_language VARCHAR(20) NOT NULL,
  secondary_language VARCHAR(20),
  preferred_contact_methods TEXT[] NOT NULL DEFAULT '{}' CHECK (preferred_contact_methods <@ ARRAY['Email','Telephone Call','Telegram','WhatsApp']::TEXT[]),
  telegram_handle VARCHAR(120),
  whatsapp_number VARCHAR(40),
  subject VARCHAR(180) NOT NULL,
  message TEXT NOT NULL,
  sms_consent BOOLEAN NOT NULL DEFAULT FALSE,
  legal_consent BOOLEAN NOT NULL DEFAULT FALSE,
  ip_hash CHAR(64),
  status VARCHAR(16) NOT NULL DEFAULT 'new' CHECK (status IN ('new','in_progress','resolved','closed')),
  assigned_to BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS contact_submissions_status_created_idx ON contact_submissions(status,created_at DESC);
CREATE INDEX IF NOT EXISTS contact_submissions_email_created_idx ON contact_submissions(LOWER(email),created_at DESC);
