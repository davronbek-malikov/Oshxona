-- ============================================================
-- OTP table for Telegram-based phone authentication
-- ============================================================

CREATE TABLE IF NOT EXISTS phone_otps (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone       text NOT NULL,
  code        text NOT NULL,
  expires_at  timestamptz NOT NULL,
  used        boolean DEFAULT false,
  delivered   boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS phone_otps_phone ON phone_otps(phone);
CREATE INDEX IF NOT EXISTS phone_otps_expires ON phone_otps(expires_at);

ALTER TABLE phone_otps ENABLE ROW LEVEL SECURITY;

-- No user-facing RLS needed (service role only touches this table via API routes)
-- But we need at least one policy so RLS doesn't block service role
CREATE POLICY "otps_service_only" ON phone_otps
  USING (false);  -- blocks all direct client access; API routes use service role key

-- Cron: delete used or expired OTPs older than 1 hour
SELECT cron.schedule(
  'cleanup-otps-hourly',
  '0 * * * *',
  $$DELETE FROM phone_otps WHERE expires_at < now() - interval '1 hour';$$
);
