DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='learning_resources_asset_fk' AND conrelid='learning_resources'::regclass) THEN
    ALTER TABLE learning_resources ADD CONSTRAINT learning_resources_asset_fk
      FOREIGN KEY(object_key) REFERENCES stored_assets(object_key) ON DELETE RESTRICT;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS course_message_threads (
  id BIGSERIAL PRIMARY KEY,
  course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  member_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  subject VARCHAR(180) NOT NULL,
  status VARCHAR(12) NOT NULL DEFAULT 'open' CHECK (status IN ('open','answered','closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS course_message_threads_course_idx ON course_message_threads(course_id,status,updated_at DESC);

CREATE TABLE IF NOT EXISTS course_messages (
  id BIGSERIAL PRIMARY KEY,
  thread_id BIGINT NOT NULL REFERENCES course_message_threads(id) ON DELETE CASCADE,
  author_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS course_messages_thread_idx ON course_messages(thread_id,created_at);
