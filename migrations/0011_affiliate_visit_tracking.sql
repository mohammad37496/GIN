ALTER TABLE affiliate_clicks ADD COLUMN IF NOT EXISTS visit_day DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE affiliate_clicks ADD COLUMN IF NOT EXISTS daily_dedupe_enabled BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE affiliate_clicks SET visit_day=visited_at::date;
WITH ranked AS (
  SELECT id,ROW_NUMBER() OVER(PARTITION BY affiliate_id,visitor_hash,visit_day ORDER BY visited_at,id) AS position
  FROM affiliate_clicks
)
UPDATE affiliate_clicks a SET daily_dedupe_enabled=TRUE
FROM ranked r WHERE r.id=a.id AND r.position=1;
CREATE UNIQUE INDEX IF NOT EXISTS affiliate_clicks_daily_visitor_uidx
  ON affiliate_clicks(affiliate_id,visitor_hash,visit_day) WHERE daily_dedupe_enabled=TRUE;
