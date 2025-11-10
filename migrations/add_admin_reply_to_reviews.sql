-- Add admin reply support to reviews table

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS admin_reply TEXT,
  ADD COLUMN IF NOT EXISTS admin_reply_at TIMESTAMPTZ;

