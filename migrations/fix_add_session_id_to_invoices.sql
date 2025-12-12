-- Fix: Add session_id column and foreign key to invoices table
-- This migration adds the missing session_id column that the QuickBooks system needs

-- Step 1: Add session_id column if it doesn't exist
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS session_id INTEGER;

-- Step 2: Add foreign key constraint (drop first if exists to avoid errors)
DO $$
BEGIN
  -- Check if sessions table exists
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sessions') THEN
    -- Drop existing constraint if it exists (to allow re-running)
    ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_session_id_fkey;
    
    -- Add the foreign key constraint
    ALTER TABLE invoices 
    ADD CONSTRAINT invoices_session_id_fkey 
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL;
    
    RAISE NOTICE 'Successfully added session_id foreign key to invoices table';
  ELSE
    RAISE EXCEPTION 'Sessions table does not exist. Please run create_sessions_table.sql first.';
  END IF;
END $$;

-- Step 3: Add other missing columns that might not exist
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_email TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_number TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_date DATE;

-- Step 4: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_invoices_session_id ON invoices(session_id);

-- Verification query (run this separately to check)
-- SELECT 
--     tc.table_name, 
--     kcu.column_name, 
--     ccu.table_name AS foreign_table_name,
--     ccu.column_name AS foreign_column_name 
-- FROM information_schema.table_constraints AS tc 
-- JOIN information_schema.key_column_usage AS kcu
--   ON tc.constraint_name = kcu.constraint_name
-- JOIN information_schema.constraint_column_usage AS ccu
--   ON ccu.constraint_name = tc.constraint_name
-- WHERE tc.constraint_type = 'FOREIGN KEY' 
--   AND tc.table_name = 'invoices'
--   AND kcu.column_name = 'session_id';

