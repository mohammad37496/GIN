ALTER TABLE stored_assets ADD COLUMN IF NOT EXISTS upload_key TEXT;
ALTER TABLE stored_assets ADD COLUMN IF NOT EXISTS upload_etag TEXT;
ALTER TABLE stored_assets ADD COLUMN IF NOT EXISTS finalizing_at TIMESTAMPTZ;

UPDATE stored_assets SET upload_key=object_key WHERE upload_key IS NULL;
ALTER TABLE stored_assets ALTER COLUMN upload_key SET NOT NULL;

ALTER TABLE stored_assets DROP CONSTRAINT IF EXISTS stored_assets_status_check;
ALTER TABLE stored_assets ADD CONSTRAINT stored_assets_status_check
  CHECK (status IN ('pending','finalizing','ready','quarantined','deleted'));

CREATE INDEX IF NOT EXISTS stored_assets_finalizing_idx
  ON stored_assets(finalizing_at) WHERE status='finalizing';
