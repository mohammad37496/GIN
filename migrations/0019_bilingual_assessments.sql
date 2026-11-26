ALTER TABLE assessments
  ADD COLUMN IF NOT EXISTS title_en VARCHAR(180),
  ADD COLUMN IF NOT EXISTS description_en TEXT;

ALTER TABLE assessment_questions
  ADD COLUMN IF NOT EXISTS prompt_en TEXT,
  ADD COLUMN IF NOT EXISTS explanation_en TEXT;

-- Option translations are stored alongside the existing option IDs and Persian labels
-- as optional label_en members in the existing JSONB options array.
