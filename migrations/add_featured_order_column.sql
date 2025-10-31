-- Add featured_order column to photos table for custom ordering of featured photos
ALTER TABLE photos ADD COLUMN IF NOT EXISTS featured_order INTEGER DEFAULT 0;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_featured_order ON photos(featured_order);

