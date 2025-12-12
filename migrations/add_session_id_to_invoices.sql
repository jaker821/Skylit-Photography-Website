-- Add session_id column to invoices table for sessions support
-- IMPORTANT: Run migrations/create_sessions_table.sql FIRST, then run this migration

-- Add session_id column if it doesn't exist
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS session_id INTEGER;

-- Add foreign key constraint if sessions table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sessions') THEN
    -- Drop existing constraint if it exists
    ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_session_id_fkey;
    -- Add foreign key constraint
    ALTER TABLE invoices 
    ADD CONSTRAINT invoices_session_id_fkey 
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL;
  ELSE
    RAISE NOTICE 'Sessions table does not exist. Please run create_sessions_table.sql first.';
  END IF;
END $$;

-- Add other missing columns that might not exist
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_email TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_number TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_date DATE;

-- Create index for session_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_invoices_session_id ON invoices(session_id);
