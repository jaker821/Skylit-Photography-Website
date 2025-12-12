-- Migration to update invoices table for sessions support
-- This handles both existing invoices table and adds session_id column

-- Add session_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE invoices ADD COLUMN session_id INTEGER;
    
    -- Add foreign key constraint if sessions table exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sessions') THEN
      ALTER TABLE invoices 
      ADD CONSTRAINT invoices_session_id_fkey 
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL;
    END IF;
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

-- Update existing invoices to have client_name and client_email if they're null
-- (This assumes there might be existing invoices with booking_id that we need to handle)
UPDATE invoices 
SET client_name = COALESCE(client_name, 'Unknown Client')
WHERE client_name IS NULL;

UPDATE invoices 
SET client_email = COALESCE(client_email, 'unknown@email.com')
WHERE client_email IS NULL;

-- Create index for session_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_invoices_session_id ON invoices(session_id);

-- Create unique index on invoice_number if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'invoices_invoice_number_key'
  ) THEN
    CREATE UNIQUE INDEX invoices_invoice_number_key ON invoices(invoice_number) WHERE invoice_number IS NOT NULL;
  END IF;
END $$;

