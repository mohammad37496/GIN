ALTER TABLE memberships DROP CONSTRAINT IF EXISTS memberships_source_check;
ALTER TABLE memberships ADD CONSTRAINT memberships_source_check
  CHECK (source IN ('admin','payment','migration','member_change','request'));

CREATE INDEX IF NOT EXISTS memberships_user_effective_idx ON memberships(user_id,starts_at,ends_at) WHERE status IN ('pending','active','past_due');
