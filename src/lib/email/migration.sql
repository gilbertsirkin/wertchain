-- Run this in Supabase SQL editor
-- Creates the email log table for admin email tracking

CREATE TABLE IF NOT EXISTS wc_email_log (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_email   TEXT NOT NULL,
  subject           TEXT NOT NULL,
  email_type        TEXT NOT NULL CHECK (email_type IN ('compose', 'campaign')),
  campaign_day      INTEGER CHECK (campaign_day BETWEEN 1 AND 7),
  status            TEXT NOT NULL DEFAULT 'SENT',
  sent_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_log_sent_at ON wc_email_log(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_log_recipient ON wc_email_log(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_log_type ON wc_email_log(email_type);

-- RLS: only admins can read, service role can insert
ALTER TABLE wc_email_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view email log"
  ON wc_email_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM wc_admins
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Service role bypasses RLS for inserts from API routes (adminClient)
