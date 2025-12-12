-- Create sessions table for comprehensive quote-to-invoice tracking
-- Note: invoice_id foreign key will be added after invoices table is updated
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  session_type TEXT NOT NULL,
  date DATE,
  time TEXT,
  location TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'quoted' CHECK (status IN ('quoted', 'booked', 'invoiced')),
  quote_amount DECIMAL(10, 2),
  invoice_amount DECIMAL(10, 2),
  invoice_id INTEGER, -- Foreign key constraint added separately
  package_id INTEGER,
  add_ons JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  quoted_at TIMESTAMPTZ,
  booked_at TIMESTAMPTZ,
  invoiced_at TIMESTAMPTZ
);

-- Add foreign key constraint for invoice_id after invoices table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'invoices') THEN
    ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_invoice_id_fkey;
    ALTER TABLE sessions 
    ADD CONSTRAINT sessions_invoice_id_fkey 
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create invoices table if it doesn't exist (with fallback for existing tables)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'invoices') THEN
    CREATE TABLE invoices (
      id SERIAL PRIMARY KEY,
      session_id INTEGER REFERENCES sessions(id) ON DELETE SET NULL,
      client_name TEXT NOT NULL,
      client_email TEXT NOT NULL,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      amount DECIMAL(10, 2) NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
      invoice_number TEXT UNIQUE,
      items JSONB DEFAULT '[]'::jsonb,
      notes TEXT,
      due_date DATE,
      paid_date DATE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  END IF;
END $$;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_client_email ON sessions(client_email);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_session_id ON invoices(session_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_email ON invoices(client_email);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

