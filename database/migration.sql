-- ============================================================
--  WipSom — Migration: Email Verification
--  Run AFTER schema.sql if upgrading an existing database.
--  Safe to run multiple times (uses IF NOT EXISTS / DO blocks).
-- ============================================================

-- 1. Add email_verified column to users
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='users' AND column_name='email_verified'
  ) THEN
    ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- 2. Create email verification tokens table
CREATE TABLE IF NOT EXISTS email_verify_tokens (
  id         SERIAL PRIMARY KEY,
  user_id    INT REFERENCES users(id) ON DELETE CASCADE,
  token      VARCHAR(128) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours',
  used       BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evt_token ON email_verify_tokens(token);

-- 3. Mark existing admin as already verified
UPDATE users SET email_verified = TRUE WHERE role = 'admin';
