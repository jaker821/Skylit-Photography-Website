-- Add is_hidden column to shoots table
ALTER TABLE shoots ADD COLUMN IF NOT EXISTS is_hidden INTEGER DEFAULT 0;

-- Add is_hidden column to photos table  
ALTER TABLE photos ADD COLUMN IF NOT EXISTS is_hidden INTEGER DEFAULT 0;

-- Add category column to shoots table (if it doesn't exist as a column, since it's stored via category_id)
ALTER TABLE shoots ADD COLUMN IF NOT EXISTS category TEXT;
