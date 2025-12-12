-- Create discount_codes table for coupon/discount management
CREATE TABLE IF NOT EXISTS discount_codes (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL,
  min_purchase_amount DECIMAL(10, 2),
  max_discount_amount DECIMAL(10, 2),
  valid_from DATE,
  valid_until DATE,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON discount_codes(active);
CREATE INDEX IF NOT EXISTS idx_discount_codes_valid_dates ON discount_codes(valid_from, valid_until);

-- Add discount_code_id and discount_amount to sessions table
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS discount_code_id INTEGER REFERENCES discount_codes(id) ON DELETE SET NULL;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0;

-- Create index for discount_code_id
CREATE INDEX IF NOT EXISTS idx_sessions_discount_code_id ON sessions(discount_code_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_discount_codes_updated_at ON discount_codes;
CREATE TRIGGER update_discount_codes_updated_at BEFORE UPDATE ON discount_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

