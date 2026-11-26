ALTER TABLE payment_webhook_events DROP CONSTRAINT IF EXISTS payment_webhook_events_status_check;
ALTER TABLE payment_webhook_events ADD CONSTRAINT payment_webhook_events_status_check
  CHECK (status IN ('received','processed','failed','ignored','retryable'));

CREATE INDEX IF NOT EXISTS payment_webhook_events_retryable_idx
  ON payment_webhook_events(provider,received_at) WHERE status='retryable';
