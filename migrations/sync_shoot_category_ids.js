/**
 * Migration Script: Sync shoot category_id values based on category text
 * 
 * This script:
 * 1. Updates shoots that have a category text matching an existing category
 * 2. Creates new categories for shoots with category text that doesn't match any category
 * 3. Updates category text field to match the category name for consistency
 * 
 * Run this script with: node migrations/sync_shoot_category_ids.js
 */

require('dotenv').config();
const db = require('../server/database');

async function syncShootCategoryIds() {
  try {
    console.log('🔄 Starting migration: Sync shoot category_ids...');
    
    // Initialize database connection
    await db.init();
    
    // Step 1: Get all shoots with category text but no category_id
    const shoots = await db.all('SELECT * FROM shoots WHERE (category_id IS NULL OR category_id = 0) AND category IS NOT NULL AND category != ""');
    console.log(`📸 Found ${shoots.length} shoots with category text but no category_id`);
    
    let updated = 0;
    let created = 0;
    
    for (const shoot of shoots) {
      // Skip if category is null or empty
      if (!shoot.category || typeof shoot.category !== 'string' || !shoot.category.trim()) {
        console.log(`  ⚠️  Skipping shoot "${shoot.title}" (ID: ${shoot.id}) - category is empty or invalid`);
        continue;
      }
      
      const categoryName = shoot.category.trim();
      
      // Try to find existing category
      let category = await db.get('SELECT * FROM categories WHERE LOWER(name) = LOWER(?)', [categoryName]);
      
      if (!category) {
        // Create new category if it doesn't exist
        try {
          console.log(`  ➕ Creating new category: "${categoryName}"`);
          const result = await db.run(
            'INSERT INTO categories (name, description, created_at, updated_at) VALUES (?, ?, ?, ?)',
            [categoryName, null, new Date().toISOString(), new Date().toISOString()]
          );
          category = await db.get('SELECT * FROM categories WHERE id = ?', [result.id]);
          created++;
        } catch (error) {
          // If category already exists (maybe created by another process), try to fetch it again
          if (error.code === '23505' || error.message.includes('duplicate') || error.message.includes('unique')) {
            console.log(`  ℹ️  Category "${categoryName}" already exists, fetching it...`);
            category = await db.get('SELECT * FROM categories WHERE LOWER(name) = LOWER(?)', [categoryName]);
            if (!category) {
              // Try exact match as fallback
              category = await db.get('SELECT * FROM categories WHERE name = ?', [categoryName]);
            }
            if (!category) {
              console.error(`  ❌ Could not find or create category "${categoryName}"`);
              continue;
            }
          } else {
            throw error;
          }
        }
      }
      
      // Update shoot with category_id
      console.log(`  ✅ Updating shoot "${shoot.title}" (ID: ${shoot.id}) with category_id: ${category.id} (${category.name})`);
      await db.run(
        'UPDATE shoots SET category_id = ?, category = ?, updated_at = ? WHERE id = ?',
        [category.id, category.name, new Date().toISOString(), shoot.id]
      );
      updated++;
    }
    
    // Step 2: Update shoots that have category_id but category text doesn't match
    const shootsWithId = await db.all('SELECT * FROM shoots WHERE category_id IS NOT NULL AND category_id != 0');
    console.log(`\n📸 Checking ${shootsWithId.length} shoots with category_id for consistency...`);
    
    let synced = 0;
    for (const shoot of shootsWithId) {
      const category = await db.get('SELECT * FROM categories WHERE id = ?', [shoot.category_id]);
      if (category && category.name !== shoot.category) {
        console.log(`  🔄 Syncing shoot "${shoot.title}" (ID: ${shoot.id}): "${shoot.category}" -> "${category.name}"`);
        await db.run(
          'UPDATE shoots SET category = ?, updated_at = ? WHERE id = ?',
          [category.name, new Date().toISOString(), shoot.id]
        );
        synced++;
      }
    }
    
    console.log('\n✅ Migration completed!');
    console.log(`   - Updated ${updated} shoots with category_id`);
    console.log(`   - Created ${created} new categories`);
    console.log(`   - Synced ${synced} shoots with mismatched category text`);
    
    await db.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await db.close();
    process.exit(1);
  }
}

// Run migration
syncShootCategoryIds();

