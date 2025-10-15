const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
  constructor() {
    this.db = null;
    this.dbPath = path.join(__dirname, 'data', 'photography.db');
  }

  // Initialize database connection and create tables
  async init() {
    return new Promise((resolve, reject) => {
      // Ensure the data directory exists
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
        } else {
          console.log('✅ Connected to SQLite database');
          this.createTables()
            .then(() => {
              console.log('✅ Database tables created/verified');
              resolve();
            })
            .catch(reject);
        }
      });
    });
  }

  // Create all necessary tables
  async createTables() {
    const tables = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        phone TEXT,
        name TEXT,
        google_id TEXT UNIQUE,
        profile_picture TEXT,
        auth_method TEXT DEFAULT 'local',
        role TEXT DEFAULT 'user',
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Shoots table
      `CREATE TABLE IF NOT EXISTS shoots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT,
        date TEXT,
        authorized_emails TEXT, -- JSON array of emails
        download_stats TEXT, -- JSON object with download data
        high_res_deleted_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Photos table
      `CREATE TABLE IF NOT EXISTS photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shoot_id INTEGER NOT NULL,
        original_name TEXT,
        filename TEXT,
        display_url TEXT, -- Compressed version URL
        download_url TEXT, -- High-res version URL
        display_key TEXT, -- Spaces key for compressed
        download_key TEXT, -- Spaces key for original
        original_size INTEGER, -- Size in bytes
        compressed_size INTEGER, -- Size in bytes
        has_high_res BOOLEAN DEFAULT 1,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (shoot_id) REFERENCES shoots (id) ON DELETE CASCADE
      )`,

      // Bookings table
      `CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_name TEXT NOT NULL,
        client_email TEXT NOT NULL,
        session_type TEXT,
        date TEXT,
        time TEXT,
        location TEXT,
        notes TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Invoices table
      `CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id INTEGER,
        amount REAL,
        description TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE SET NULL
      )`,

      // Expenses table
      `CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT,
        date TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Pricing categories table
      `CREATE TABLE IF NOT EXISTS pricing_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Pricing packages table
      `CREATE TABLE IF NOT EXISTS pricing_packages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Pricing add-ons table
      `CREATE TABLE IF NOT EXISTS pricing_addons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const tableSQL of tables) {
      await this.run(tableSQL);
    }

    // Create indexes for better performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_shoots_category ON shoots(category)',
      'CREATE INDEX IF NOT EXISTS idx_photos_shoot_id ON photos(shoot_id)',
      'CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)',
      'CREATE INDEX IF NOT EXISTS idx_invoices_booking_id ON invoices(booking_id)'
    ];

    for (const indexSQL of indexes) {
      await this.run(indexSQL);
    }

    // Add phone column if it doesn't exist (for existing databases)
    try {
      await this.run('ALTER TABLE users ADD COLUMN phone TEXT');
    } catch (error) {
      // Only ignore duplicate column errors, log others
      if (error.code === 'SQLITE_ERROR' && error.message.includes('duplicate column name')) {
        console.log('📱 Phone column already exists, skipping...');
      } else {
        console.error('Error adding phone column:', error);
        throw error;
      }
    }

    // Add Google OAuth fields if they don't exist
    const newFields = [
      { name: 'name', type: 'TEXT' },
      { name: 'google_id', type: 'TEXT UNIQUE' },
      { name: 'profile_picture', type: 'TEXT' },
      { name: 'auth_method', type: 'TEXT DEFAULT "local"' }
    ];

    for (const field of newFields) {
      try {
        await this.run(`ALTER TABLE users ADD COLUMN ${field.name} ${field.type}`);
        console.log(`📱 Added ${field.name} column to users table`);
      } catch (error) {
        if (error.code === 'SQLITE_ERROR' && error.message.includes('duplicate column name')) {
          console.log(`📱 ${field.name} column already exists, skipping...`);
        } else {
          console.error(`Error adding ${field.name} column:`, error);
          throw error;
        }
      }
    }
  }

  // Generic database operations
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          // Don't log expected errors like duplicate columns
          if (!(err.code === 'SQLITE_ERROR' && err.message.includes('duplicate column name'))) {
            console.error('Database run error:', err);
          }
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          console.error('Database get error:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('Database all error:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Close database connection
  close() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('Error closing database:', err);
          } else {
            console.log('Database connection closed');
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  // Helper function to parse JSON fields
  parseJSONField(field) {
    if (!field) return null;
    try {
      return JSON.parse(field);
    } catch (e) {
      console.warn('Failed to parse JSON field:', field);
      return null;
    }
  }

  // Helper function to stringify JSON fields
  stringifyJSONField(field) {
    if (!field) return null;
    return JSON.stringify(field);
  }
}

// Create singleton instance
const db = new Database();

module.exports = db;
