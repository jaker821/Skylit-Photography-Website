-- Migration to consolidate bookings table into sessions table
-- This creates a unified session management system

-- Step 1: Add missing columns to sessions table if they don't exist
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT FALSE;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10, 2);

-- Step 2: Update status constraint to include 'request'
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_status_check;
ALTER TABLE sessions ADD CONSTRAINT sessions_status_check 
  CHECK (status IN ('request', 'quoted', 'booked', 'paid', 'invoiced'));

-- Step 3: Migrate existing bookings data to sessions
-- Only migrate if bookings table exists and has data
DO $$
DECLARE
  booking_count INTEGER;
BEGIN
  -- Check if bookings table exists
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bookings') THEN
    -- Count existing bookings
    SELECT COUNT(*) INTO booking_count FROM bookings;
    
    IF booking_count > 0 THEN
      -- Map old statuses to new statuses
      INSERT INTO sessions (
        client_name, client_email, user_id, session_type, date, time, location, 
        notes, status, quote_amount, package_id, created_at, updated_at, booked_at
      )
      SELECT 
        b.client_name,
        b.client_email,
        b.user_id,
        b.session_type,
        b.date,
        b.time,
        b.location,
        b.notes,
        CASE 
          WHEN LOWER(b.status) = 'pending' THEN 'request'
          WHEN LOWER(b.status) = 'booked' THEN 'booked'
          WHEN LOWER(b.status) = 'invoiced' THEN 'invoiced'
          ELSE 'request'
        END as status,
        b.quote_amount,
        b.package_id,
        b.created_at,
        b.updated_at,
        CASE WHEN LOWER(b.status) = 'booked' OR LOWER(b.status) = 'invoiced' THEN b.updated_at ELSE NULL END as booked_at
      FROM bookings b
      WHERE NOT EXISTS (
        -- Avoid duplicates if session already exists with same client/date
        SELECT 1 FROM sessions s 
        WHERE s.client_email = b.client_email 
        AND s.date = b.date 
        AND s.session_type = b.session_type
      );
      
      RAISE NOTICE 'Migrated % bookings to sessions table', booking_count;
    ELSE
      RAISE NOTICE 'No bookings to migrate';
    END IF;
  ELSE
    RAISE NOTICE 'Bookings table does not exist, skipping migration';
  END IF;
END $$;

-- Step 4: Update reviews table to reference sessions instead of bookings
-- First, add session_id column if it doesn't exist
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS session_id INTEGER REFERENCES sessions(id) ON DELETE SET NULL;

-- Migrate booking_id references to session_id where possible
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'booking_id') THEN
    -- Try to match reviews to sessions based on user_id and date proximity
    UPDATE reviews r
    SET session_id = (
      SELECT s.id 
      FROM sessions s 
      WHERE s.user_id = r.user_id 
      AND s.created_at BETWEEN r.created_at - INTERVAL '7 days' AND r.created_at + INTERVAL '7 days'
      LIMIT 1
    )
    WHERE r.session_id IS NULL AND r.booking_id IS NOT NULL;
    
    RAISE NOTICE 'Updated reviews to reference sessions';
  END IF;
END $$;

-- Step 5: Update review_invites table similarly
ALTER TABLE review_invites ADD COLUMN IF NOT EXISTS session_id INTEGER REFERENCES sessions(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'review_invites' AND column_name = 'booking_id') THEN
    UPDATE review_invites ri
    SET session_id = (
      SELECT s.id 
      FROM sessions s 
      WHERE s.user_id = ri.user_id 
      AND s.client_email = ri.client_email
      AND s.created_at BETWEEN ri.created_at - INTERVAL '7 days' AND ri.created_at + INTERVAL '7 days'
      LIMIT 1
    )
    WHERE ri.session_id IS NULL AND ri.booking_id IS NOT NULL;
    
    RAISE NOTICE 'Updated review_invites to reference sessions';
  END IF;
END $$;

-- Step 6: Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_sessions_paid ON sessions(paid);
CREATE INDEX IF NOT EXISTS idx_sessions_paid_at ON sessions(paid_at);
CREATE INDEX IF NOT EXISTS idx_reviews_session_id ON reviews(session_id);
CREATE INDEX IF NOT EXISTS idx_review_invites_session_id ON review_invites(session_id);

-- Step 7: Update invoices table to ensure session_id column exists (if not already done)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS session_id INTEGER REFERENCES sessions(id) ON DELETE SET NULL;

-- Note: We're NOT dropping the bookings table yet to allow for rollback
-- You can drop it manually after verifying everything works:
-- DROP TABLE IF EXISTS bookings CASCADE;

