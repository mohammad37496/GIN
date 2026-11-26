ALTER TABLE contact_submissions
  DROP CONSTRAINT IF EXISTS contact_submissions_preferred_contact_methods_check;

UPDATE contact_submissions
SET preferred_contact_methods = ARRAY(
  SELECT CASE method
    WHEN 'email' THEN 'Email'
    WHEN 'phone' THEN 'Telephone Call'
    WHEN 'telephone' THEN 'Telephone Call'
    WHEN 'telegram' THEN 'Telegram'
    WHEN 'whatsapp' THEN 'WhatsApp'
    ELSE method
  END
  FROM unnest(preferred_contact_methods) AS method
);

ALTER TABLE contact_submissions
  ADD CONSTRAINT contact_submissions_preferred_contact_methods_check
  CHECK (preferred_contact_methods <@ ARRAY['Email','Telephone Call','Telegram','WhatsApp']::TEXT[]);
