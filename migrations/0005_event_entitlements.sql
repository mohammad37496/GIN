CREATE TABLE IF NOT EXISTS membership_plan_events (
  plan_id BIGINT NOT NULL REFERENCES membership_plans(id) ON DELETE CASCADE,
  event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  PRIMARY KEY(plan_id,event_id)
);

CREATE TABLE IF NOT EXISTS event_registration_events (
  id BIGSERIAL PRIMARY KEY,
  registration_id BIGINT NOT NULL REFERENCES event_registrations(id) ON DELETE RESTRICT,
  actor_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(16) NOT NULL CHECK (event_type IN ('registered','waitlisted','canceled','attended','no_show','promoted')),
  previous_status VARCHAR(12),
  next_status VARCHAR(12) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS event_registration_events_history_idx ON event_registration_events(registration_id,created_at DESC);
