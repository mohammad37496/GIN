CREATE TABLE IF NOT EXISTS course_categories (
  id BIGSERIAL PRIMARY KEY,
  slug VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(140) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS courses (
  id BIGSERIAL PRIMARY KEY,
  slug VARCHAR(120) NOT NULL UNIQUE,
  title VARCHAR(180) NOT NULL,
  summary VARCHAR(360) NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  cover_image_url TEXT,
  status VARCHAR(12) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  access_type VARCHAR(12) NOT NULL DEFAULT 'free' CHECK (access_type IN ('free','members','paid')),
  price_minor BIGINT NOT NULL DEFAULT 0 CHECK (price_minor >= 0),
  currency VARCHAR(3),
  estimated_minutes INTEGER NOT NULL DEFAULT 0 CHECK (estimated_minutes >= 0),
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  CONSTRAINT courses_price_access_check CHECK (
    (access_type IN ('free','members') AND price_minor=0 AND currency IS NULL)
    OR (access_type='paid' AND price_minor>0 AND currency ~ '^[A-Z]{3}$')
  )
);
ALTER TABLE courses ALTER COLUMN currency DROP DEFAULT;
ALTER TABLE courses ALTER COLUMN currency DROP NOT NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='courses_price_access_check' AND conrelid='courses'::regclass) THEN
    ALTER TABLE courses ADD CONSTRAINT courses_price_access_check CHECK (
      (access_type IN ('free','members') AND price_minor=0 AND currency IS NULL)
      OR (access_type='paid' AND price_minor>0 AND currency ~ '^[A-Z]{3}$')
    );
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS courses_status_created_idx ON courses(status, created_at DESC);

CREATE TABLE IF NOT EXISTS course_category_links (
  course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  category_id BIGINT NOT NULL REFERENCES course_categories(id) ON DELETE CASCADE,
  PRIMARY KEY(course_id, category_id)
);

CREATE TABLE IF NOT EXISTS course_sections (
  id BIGSERIAL PRIMARY KEY,
  course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(180) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(course_id, position)
);

CREATE TABLE IF NOT EXISTS lessons (
  id BIGSERIAL PRIMARY KEY,
  section_id BIGINT NOT NULL REFERENCES course_sections(id) ON DELETE CASCADE,
  title VARCHAR(180) NOT NULL,
  summary VARCHAR(360) NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  video_url TEXT,
  duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  is_preview BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(12) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  position INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(section_id, position)
);
CREATE INDEX IF NOT EXISTS lessons_section_status_idx ON lessons(section_id, status, position);

CREATE TABLE IF NOT EXISTS course_instructors (
  course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(course_id, user_id)
);
CREATE INDEX IF NOT EXISTS course_instructors_user_idx ON course_instructors(user_id, course_id);

CREATE TABLE IF NOT EXISTS course_enrollments (
  id BIGSERIAL PRIMARY KEY,
  course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(12) NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','revoked')),
  source VARCHAR(14) NOT NULL DEFAULT 'free' CHECK (source IN ('free','admin','purchase','subscription')),
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE(course_id, user_id)
);
CREATE INDEX IF NOT EXISTS course_enrollments_user_status_idx ON course_enrollments(user_id, status, enrolled_at DESC);

CREATE TABLE IF NOT EXISTS lesson_progress (
  id BIGSERIAL PRIMARY KEY,
  lesson_id BIGINT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(14) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed')),
  watched_seconds INTEGER NOT NULL DEFAULT 0 CHECK (watched_seconds >= 0),
  last_position_seconds INTEGER NOT NULL DEFAULT 0 CHECK (last_position_seconds >= 0),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(lesson_id, user_id),
  CHECK ((status='completed' AND completed_at IS NOT NULL) OR status='in_progress')
);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='lesson_progress_completion_check' AND conrelid='lesson_progress'::regclass) THEN
    ALTER TABLE lesson_progress ADD CONSTRAINT lesson_progress_completion_check CHECK (
      (status='completed' AND completed_at IS NOT NULL) OR status='in_progress'
    );
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS lesson_progress_user_status_idx ON lesson_progress(user_id, status, updated_at DESC);

CREATE TABLE IF NOT EXISTS learning_resources (
  id BIGSERIAL PRIMARY KEY,
  lesson_id BIGINT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title VARCHAR(180) NOT NULL,
  object_key TEXT NOT NULL UNIQUE,
  content_type VARCHAR(120) NOT NULL,
  size_bytes BIGINT NOT NULL CHECK (size_bytes > 0),
  is_downloadable BOOLEAN NOT NULL DEFAULT TRUE,
  position INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS learning_resources_lesson_idx ON learning_resources(lesson_id, position);
