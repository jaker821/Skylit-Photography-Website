-- Add missing columns to bookings table for session workflow

-- Add invoice_id column if it doesn't exist
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS invoice_id TEXT;

-- Add quote_amount column if it doesn't exist  
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS quote_amount DECIMAL(10, 2);

-- Add quote_amount column if it doesn't exist  
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS package_id INTEGER;

-- Ensure all required columns exist
-- booking_id, client_name, client_email, user_id, session_type, date, time, location, notes, status, created_at, updated_at
