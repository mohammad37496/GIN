ALTER TABLE referral_attributions DROP CONSTRAINT IF EXISTS referral_attributions_check;

CREATE OR REPLACE FUNCTION enforce_no_self_referral() RETURNS trigger AS $$
DECLARE affiliate_owner BIGINT;
BEGIN
  SELECT user_id INTO affiliate_owner FROM affiliate_accounts WHERE id=NEW.affiliate_id;
  IF affiliate_owner IS NULL OR affiliate_owner=NEW.referred_user_id THEN
    RAISE EXCEPTION 'invalid referral attribution' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS referral_attributions_self_referral_guard ON referral_attributions;
CREATE TRIGGER referral_attributions_self_referral_guard
  BEFORE INSERT OR UPDATE OF affiliate_id,referred_user_id ON referral_attributions
  FOR EACH ROW EXECUTE FUNCTION enforce_no_self_referral();
