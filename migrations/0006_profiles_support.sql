CREATE TABLE IF NOT EXISTS user_profiles (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name VARCHAR(120) NOT NULL DEFAULT '',
  email VARCHAR(254),
  phone VARCHAR(40),
  locale VARCHAR(2) NOT NULL DEFAULT 'fa' CHECK (locale IN ('fa','en')),
  timezone VARCHAR(80) NOT NULL DEFAULT 'Asia/Tehran',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_email_uidx ON user_profiles(LOWER(email)) WHERE email IS NOT NULL AND email<>'';

CREATE TABLE IF NOT EXISTS support_replies (
  id BIGSERIAL PRIMARY KEY,
  message_id BIGINT NOT NULL REFERENCES support_messages(id) ON DELETE CASCADE,
  author_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  is_staff BOOLEAN NOT NULL DEFAULT FALSE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS support_replies_message_idx ON support_replies(message_id,created_at);
