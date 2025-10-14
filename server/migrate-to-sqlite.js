const fs = require('fs').promises;
const path = require('path');
const db = require('./database');

// File paths
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SHOOTS_FILE = path.join(DATA_DIR, 'shoots.json');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');
const INVOICES_FILE = path.join(DATA_DIR, 'invoices.json');
const EXPENSES_FILE = path.join(DATA_DIR, 'expenses.json');
const PRICING_FILE = path.join(DATA_DIR, 'pricing.json');

async function readJSONFile(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.log(`No existing file found: ${filePath}`);
    return null;
  }
}

async function migrateUsers() {
  console.log('🔄 Migrating users...');
  const usersData = await readJSONFile(USERS_FILE);
  
  if (!usersData || !usersData.users) {
    console.log('✅ No users to migrate');
    return;
  }

  for (const user of usersData.users) {
    try {
      await db.run(
        `INSERT OR IGNORE INTO users (id, email, password_hash, role, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          user.id,
          user.email,
          user.password_hash || user.passwordHash,
          user.role || 'user',
          user.status || 'pending',
          user.createdAt || new Date().toISOString(),
          user.updatedAt || new Date().toISOString()
        ]
      );
    } catch (error) {
      console.error(`Error migrating user ${user.email}:`, error);
    }
  }
  
  console.log(`✅ Migrated ${usersData.users.length} users`);
}

async function migrateShoots() {
  console.log('🔄 Migrating shoots...');
  const shootsData = await readJSONFile(SHOOTS_FILE);
  
  if (!shootsData || !shootsData.shoots) {
    console.log('✅ No shoots to migrate');
    return;
  }

  for (const shoot of shootsData.shoots) {
    try {
      // Insert shoot
      const result = await db.run(
        `INSERT OR IGNORE INTO shoots (id, title, description, category, date, authorized_emails, download_stats, high_res_deleted_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          shoot.id,
          shoot.title,
          shoot.description || '',
          shoot.category || '',
          shoot.date || '',
          db.stringifyJSONField(shoot.authorizedEmails || []),
          db.stringifyJSONField(shoot.downloadStats || {}),
          shoot.highResDeletedAt || null,
          shoot.createdAt || new Date().toISOString(),
          shoot.updatedAt || new Date().toISOString()
        ]
      );

      // Migrate photos for this shoot
      if (shoot.photos && shoot.photos.length > 0) {
        for (const photo of shoot.photos) {
          try {
            await db.run(
              `INSERT OR IGNORE INTO photos (id, shoot_id, original_name, filename, display_url, download_url, display_key, download_key, original_size, compressed_size, has_high_res, uploaded_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                photo.id,
                shoot.id,
                photo.originalName || photo.original_name || '',
                photo.filename || '',
                photo.displayUrl || photo.url || '',
                photo.downloadUrl || photo.url || '',
                photo.displayKey || '',
                photo.downloadKey || '',
                photo.originalSize || photo.original_size || 0,
                photo.compressedSize || photo.compressed_size || 0,
                photo.hasHighRes !== false ? 1 : 0,
                photo.uploadedAt || photo.uploaded_at || new Date().toISOString()
              ]
            );
          } catch (error) {
            console.error(`Error migrating photo ${photo.id}:`, error);
          }
        }
      }
    } catch (error) {
      console.error(`Error migrating shoot ${shoot.title}:`, error);
    }
  }
  
  console.log(`✅ Migrated ${shootsData.shoots.length} shoots`);
}

async function migrateBookings() {
  console.log('🔄 Migrating bookings...');
  const bookingsData = await readJSONFile(BOOKINGS_FILE);
  
  if (!bookingsData || !bookingsData.bookings) {
    console.log('✅ No bookings to migrate');
    return;
  }

  for (const booking of bookingsData.bookings) {
    try {
      await db.run(
        `INSERT OR IGNORE INTO bookings (id, client_name, client_email, session_type, date, time, location, notes, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          booking.id,
          booking.clientName || booking.client_name || '',
          booking.clientEmail || booking.client_email || '',
          booking.sessionType || booking.session_type || '',
          booking.date || '',
          booking.time || '',
          booking.location || '',
          booking.notes || '',
          booking.status || 'pending',
          booking.createdAt || new Date().toISOString(),
          booking.updatedAt || new Date().toISOString()
        ]
      );
    } catch (error) {
      console.error(`Error migrating booking ${booking.id}:`, error);
    }
  }
  
  console.log(`✅ Migrated ${bookingsData.bookings.length} bookings`);
}

async function migrateInvoices() {
  console.log('🔄 Migrating invoices...');
  const invoicesData = await readJSONFile(INVOICES_FILE);
  
  if (!invoicesData || !invoicesData.invoices) {
    console.log('✅ No invoices to migrate');
    return;
  }

  for (const invoice of invoicesData.invoices) {
    try {
      await db.run(
        `INSERT OR IGNORE INTO invoices (id, booking_id, amount, description, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          invoice.id,
          invoice.bookingId || invoice.booking_id || null,
          invoice.amount || 0,
          invoice.description || '',
          invoice.status || 'pending',
          invoice.createdAt || new Date().toISOString(),
          invoice.updatedAt || new Date().toISOString()
        ]
      );
    } catch (error) {
      console.error(`Error migrating invoice ${invoice.id}:`, error);
    }
  }
  
  console.log(`✅ Migrated ${invoicesData.invoices.length} invoices`);
}

async function migrateExpenses() {
  console.log('🔄 Migrating expenses...');
  const expensesData = await readJSONFile(EXPENSES_FILE);
  
  if (!expensesData || !expensesData.expenses) {
    console.log('✅ No expenses to migrate');
    return;
  }

  for (const expense of expensesData.expenses) {
    try {
      await db.run(
        `INSERT OR IGNORE INTO expenses (id, description, amount, category, date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          expense.id,
          expense.description || '',
          expense.amount || 0,
          expense.category || '',
          expense.date || '',
          expense.createdAt || new Date().toISOString(),
          expense.updatedAt || new Date().toISOString()
        ]
      );
    } catch (error) {
      console.error(`Error migrating expense ${expense.id}:`, error);
    }
  }
  
  console.log(`✅ Migrated ${expensesData.expenses.length} expenses`);
}

async function migratePricing() {
  console.log('🔄 Migrating pricing...');
  const pricingData = await readJSONFile(PRICING_FILE);
  
  if (!pricingData) {
    console.log('✅ No pricing data to migrate');
    return;
  }

  // Migrate categories
  if (pricingData.categories && pricingData.categories.length > 0) {
    for (const category of pricingData.categories) {
      try {
        await db.run(
          `INSERT OR IGNORE INTO pricing_categories (name) VALUES (?)`,
          [category]
        );
      } catch (error) {
        console.error(`Error migrating category ${category}:`, error);
      }
    }
    console.log(`✅ Migrated ${pricingData.categories.length} pricing categories`);
  }

  // Migrate packages
  if (pricingData.packages && pricingData.packages.length > 0) {
    for (const package_ of pricingData.packages) {
      try {
        await db.run(
          `INSERT OR IGNORE INTO pricing_packages (id, name, description, price, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            package_.id,
            package_.name || '',
            package_.description || '',
            package_.price || 0,
            package_.createdAt || new Date().toISOString(),
            package_.updatedAt || new Date().toISOString()
          ]
        );
      } catch (error) {
        console.error(`Error migrating package ${package_.name}:`, error);
      }
    }
    console.log(`✅ Migrated ${pricingData.packages.length} pricing packages`);
  }

  // Migrate add-ons
  if (pricingData.addOns && pricingData.addOns.length > 0) {
    for (const addon of pricingData.addOns) {
      try {
        await db.run(
          `INSERT OR IGNORE INTO pricing_addons (id, name, description, price, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            addon.id,
            addon.name || '',
            addon.description || '',
            addon.price || 0,
            addon.createdAt || new Date().toISOString(),
            addon.updatedAt || new Date().toISOString()
          ]
        );
      } catch (error) {
        console.error(`Error migrating add-on ${addon.name}:`, error);
      }
    }
    console.log(`✅ Migrated ${pricingData.addOns.length} pricing add-ons`);
  }
}

async function createDefaultAdmin() {
  console.log('🔄 Creating default admin user...');
  
  // Check if admin exists
  const existingAdmin = await db.get('SELECT * FROM users WHERE role = ?', ['admin']);
  
  if (existingAdmin) {
    console.log('✅ Admin user already exists');
    return;
  }

  // Create default admin
  const bcrypt = require('bcrypt');
  const defaultPassword = 'admin123';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);
  
  try {
    await db.run(
      `INSERT INTO users (email, password_hash, role, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        'admin@skylitphotography.com',
        hashedPassword,
        'admin',
        'approved',
        new Date().toISOString(),
        new Date().toISOString()
      ]
    );
    
    console.log('✅ Created default admin user');
    console.log('📧 Email: admin@skylitphotography.com');
    console.log('🔑 Password: admin123');
    console.log('⚠️  Please change this password after first login!');
  } catch (error) {
    console.error('Error creating default admin:', error);
  }
}

async function main() {
  try {
    console.log('🚀 Starting migration from JSON to SQLite...');
    
    // Initialize database
    await db.init();
    
    // Run migrations
    await migrateUsers();
    await migrateShoots();
    await migrateBookings();
    await migrateInvoices();
    await migrateExpenses();
    await migratePricing();
    await createDefaultAdmin();
    
    console.log('🎉 Migration completed successfully!');
    console.log('📊 Database is ready to use');
    
    // Close database connection
    await db.close();
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  migrateUsers,
  migrateShoots,
  migrateBookings,
  migrateInvoices,
  migrateExpenses,
  migratePricing,
  createDefaultAdmin
};
