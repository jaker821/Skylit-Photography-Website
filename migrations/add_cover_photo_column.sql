-- Add cover_photo column to photos table
ALTER TABLE photos ADD COLUMN IF NOT EXISTS cover_photo INTEGER DEFAULT 0;
