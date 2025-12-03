-- Migration: Sync shoot category_id values based on category text
-- This script updates the category_id column in the shoots table
-- by matching the category text field with category names in the categories table

-- Step 1: Update shoots that have a category text matching an existing category
UPDATE shoots
SET category_id = (
    SELECT id 
    FROM categories 
    WHERE LOWER(categories.name) = LOWER(shoots.category)
    LIMIT 1
)
WHERE category_id IS NULL 
  AND category IS NOT NULL 
  AND category != ''
  AND EXISTS (
      SELECT 1 
      FROM categories 
      WHERE LOWER(categories.name) = LOWER(shoots.category)
  );

-- Step 2: For shoots with category text that doesn't match any category,
-- create new categories and update the shoots
-- Note: This is a manual step that may need to be run separately
-- as SQLite doesn't support INSERT ... ON CONFLICT in all versions

-- Step 3: Update category text field to match the category name for consistency
UPDATE shoots
SET category = (
    SELECT name 
    FROM categories 
    WHERE categories.id = shoots.category_id
)
WHERE category_id IS NOT NULL
  AND EXISTS (
      SELECT 1 
      FROM categories 
      WHERE categories.id = shoots.category_id
  );

