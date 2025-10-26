require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const multer = require('multer');
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');
const sharp = require('sharp');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const archiver = require('archiver');
const fs = require('fs').promises;
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy - DigitalOcean App Platform uses a load balancer
app.set('trust proxy', 1);

// Middleware
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL || 'https://your-app.ondigitalocean.app']
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json());
app.use(session({
  name: 'skylit.sid', // Explicit session cookie name
  secret: process.env.SESSION_SECRET || 'skylit-photography-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    path: '/',
    httpOnly: true,
    secure: false, // Disable secure for now to test (DigitalOcean handles HTTPS at the load balancer)
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Debug middleware - log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Session ID: ${req.sessionID} - User ID: ${req.session?.userId || 'none'}`);
  next();
});

// Passport serialization
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy (DISABLED - Can be enabled by setting environment variables)
const GOOGLE_OAUTH_ENABLED = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

if (GOOGLE_OAUTH_ENABLED) {
  console.log('✅ Google OAuth is ENABLED');
}

// ===================================
// Email Configuration
// ===================================
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASSWORD;
const adminEmail = process.env.ADMIN_EMAIL || emailUser;

// Create email transporter (will be used by both contact form and notifications)
let transporter;
if (emailUser && emailPass) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass
    }
  });
  console.log('✅ Email service is ENABLED');
} else {
  console.log('⚠️  Email service is DISABLED - Set EMAIL_USER and EMAIL_PASSWORD to enable');
}

if (GOOGLE_OAUTH_ENABLED) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists by Google ID
      let user = await db.get('SELECT * FROM users WHERE google_id = ?', [profile.id]);
      
      if (!user) {
        // Check if user exists by email
        user = await db.get('SELECT * FROM users WHERE email = ?', [profile.emails[0].value]);
        
        if (user) {
          // Link Google account to existing user
          await db.run(
            'UPDATE users SET google_id = ?, profile_picture = ?, updated_at = ? WHERE id = ?',
            [profile.id, profile.photos[0]?.value || '', new Date().toISOString(), user.id]
          );
          user.google_id = profile.id;
          user.profile_picture = profile.photos[0]?.value;
        } else {
          // Create new user with pending status
          const result = await db.run(
            `INSERT INTO users (google_id, name, email, profile_picture, phone, role, status, auth_method, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              profile.id,
              profile.displayName,
              profile.emails[0].value,
              profile.photos[0]?.value || '',
              '',
              'user',
              'pending',
              'google',
              new Date().toISOString(),
              new Date().toISOString()
            ]
          );
          
          user = await db.get('SELECT * FROM users WHERE id = ?', [result.id]);
        }
      }
      
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
} else {
  console.log('⚠️  Google OAuth is DISABLED - Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable');
}

// ===================================
// DigitalOcean Spaces Configuration
// ===================================

// Check if Spaces is configured
const SPACES_ENABLED = !!(
  process.env.SPACES_ENDPOINT && 
  process.env.SPACES_BUCKET && 
  process.env.SPACES_ACCESS_KEY && 
  process.env.SPACES_SECRET_KEY
);

let s3Client;
let storage;

if (SPACES_ENABLED) {
  console.log('✅ DigitalOcean Spaces is ENABLED');
  console.log('📦 Spaces Config:', {
    endpoint: process.env.SPACES_ENDPOINT,
    bucket: process.env.SPACES_BUCKET,
    region: process.env.SPACES_REGION || 'us-east-1',
    cdnUrl: process.env.SPACES_CDN_URL || 'Not set',
    hasAccessKey: !!process.env.SPACES_ACCESS_KEY,
    hasSecretKey: !!process.env.SPACES_SECRET_KEY
  });
  
  // Configure AWS S3 client for DigitalOcean Spaces
  s3Client = new AWS.S3({
    endpoint: new AWS.Endpoint(process.env.SPACES_ENDPOINT),
    accessKeyId: process.env.SPACES_ACCESS_KEY,
    secretAccessKey: process.env.SPACES_SECRET_KEY,
    region: process.env.SPACES_REGION || 'us-east-1', // Spaces doesn't strictly need region, but SDK requires it
    s3ForcePathStyle: true, // IMPORTANT: Use path-style URLs for DigitalOcean Spaces (nyc1.digitaloceanspaces.com/bucket-name)
    signatureVersion: 'v4'
  });

  // Configure multer to use S3 storage
  storage = multerS3({
    s3: s3Client,
    bucket: process.env.SPACES_BUCKET,
    acl: 'public-read', // Make uploaded files publicly readable
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = uniqueSuffix + path.extname(file.originalname);
      console.log('🔑 Uploading to bucket:', process.env.SPACES_BUCKET, 'File:', `portfolio/${filename}`);
      // Store in portfolio folder
      cb(null, `portfolio/${filename}`);
    },
    metadata: (req, file, cb) => {
      cb(null, { 
        fieldName: file.fieldname,
        originalName: file.originalname
      });
    }
  });
} else {
  console.log('⚠️  DigitalOcean Spaces is DISABLED - Using local storage (files will be lost on deployment!)');
  console.log('   To enable Spaces, set: SPACES_ENDPOINT, SPACES_BUCKET, SPACES_ACCESS_KEY, SPACES_SECRET_KEY');
  
  // Fallback to local disk storage
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
  
  storage = multer.diskStorage({
    destination: async (req, file, cb) => {
      const uploadDir = path.join(__dirname, 'uploads');
      try {
        await fs.access(uploadDir);
      } catch {
        await fs.mkdir(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });
}

// Configure multer for file uploads - use memory storage for processing
const upload = multer({
  storage: SPACES_ENABLED ? multer.memoryStorage() : storage, // Memory storage for compression, disk for local
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit for originals
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Helper function to upload buffer to Spaces
async function uploadBufferToSpaces(buffer, folder, filename, contentType = 'image/jpeg') {
  if (!SPACES_ENABLED || !s3Client) {
    throw new Error('Spaces not configured');
  }
  
  const key = `${folder}/${filename}`;
  const params = {
    Bucket: process.env.SPACES_BUCKET,
    Key: key,
    Body: buffer,
    ACL: 'public-read',
    ContentType: contentType
  };
  
  try {
    await s3Client.upload(params).promise();
    const cdnUrl = process.env.SPACES_CDN_URL;
    return cdnUrl ? `${cdnUrl}/${key}` : `https://${process.env.SPACES_BUCKET}.${process.env.SPACES_ENDPOINT}/${key}`;
  } catch (error) {
    console.error('Error uploading to Spaces:', error);
    throw error;
  }
}

// Data file paths
const DATA_DIR = path.join(__dirname, 'data');

async function ensureDataDirectory() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Read JSON file
// JSON file functions removed - now using database

// Initialize data files - REMOVED - Now using database only

// Initialize shoots file - REMOVED - Now using database only

// ===================================
// Authentication Routes
// ===================================

// Google OAuth Routes (only enabled if OAuth is configured)
if (GOOGLE_OAUTH_ENABLED) {
  app.get('/api/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get('/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    async (req, res) => {
      try {
        // Store user in session
        req.session.userId = req.user.id;
        req.session.userRole = req.user.role;
        
        // Session tracking removed - using database sessions only
        
        // Check if user needs approval
        if (req.user.status === 'pending') {
          // Redirect to a pending approval page
          res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/pending-approval`);
        } else if (req.user.status === 'approved' || req.user.role === 'admin') {
          // Redirect to dashboard
          const redirectUrl = req.user.role === 'admin' ? '/admin' : '/dashboard';
          res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}${redirectUrl}`);
        } else {
          // Rejected or other status
          res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=account_not_approved`);
        }
      } catch (error) {
        console.error('Google callback error:', error);
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=auth_failed`);
      }
    }
  );
}

// API endpoint to check if Google OAuth is enabled
app.get('/api/auth/google-enabled', (req, res) => {
  res.json({ enabled: GOOGLE_OAUTH_ENABLED });
});

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if email already exists
    const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Format the phone number
    const formattedPhone = formatPhoneNumber(phone);

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user with pending approval status
    const result = await db.run(
      `INSERT INTO users (name, email, password_hash, phone, role, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        email,
        hashedPassword,
        formattedPhone,
        'user',
        'pending',
        new Date().toISOString(),
        new Date().toISOString()
      ]
    );

    res.json({
      success: true,
      message: 'Registration successful! Your account is pending admin approval.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password with bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is approved (admins bypass this check)
    if (user.role !== 'admin' && user.status === 'pending') {
      return res.status(403).json({ error: 'Your account is pending admin approval. Please wait for approval.' });
    }

    if (user.role !== 'admin' && user.status === 'rejected') {
      return res.status(403).json({ error: 'Your account registration was not approved. Please contact support.' });
    }

    // Store user in session
    req.session.userId = user.id;
    req.session.userRole = user.role;

    // Explicitly save the session before responding
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ error: 'Session save failed' });
      }

      console.log('✅ Login successful - Session saved:', req.sessionID, 'User:', user.email);

      // Return user data without password
      const { password: _, ...userWithoutPassword } = user;
      res.json({
        success: true,
        user: userWithoutPassword
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout
app.post('/api/auth/logout', async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.json({ success: true });
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Check session
app.get('/api/auth/session', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ authenticated: false });
    }

    const user = await db.get('SELECT id, name, email, phone, role, status, created_at, updated_at FROM users WHERE id = ?', [req.session.userId]);

    if (!user) {
      return res.status(401).json({ authenticated: false });
    }

    res.json({
      authenticated: true,
      user: user
    });
  } catch (error) {
    console.error('Session check error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===================================
// Category Management Routes
// ===================================

// Get all categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await db.all('SELECT * FROM categories ORDER BY name');
    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new category (admin only)
app.post('/api/categories', requireAuth, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    // Check if user is admin
    const user = await db.get('SELECT * FROM users WHERE id = ?', [req.session.userId]);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Category name is required' });
    }
    
    // Check if category already exists
    const existing = await db.get('SELECT * FROM categories WHERE name = ?', [name.trim()]);
    if (existing) {
      return res.status(400).json({ error: 'Category already exists' });
    }
    
    const result = await db.run(
      'INSERT INTO categories (name, description, created_at, updated_at) VALUES (?, ?, ?, ?)',
      [name.trim(), description || null, new Date().toISOString(), new Date().toISOString()]
    );
    
    const newCategory = await db.get('SELECT * FROM categories WHERE id = ?', [result.id]);
    res.json({ success: true, category: newCategory });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update category (admin only)
app.put('/api/categories/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    // Check if user is admin
    const user = await db.get('SELECT * FROM users WHERE id = ?', [req.session.userId]);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Category name is required' });
    }
    
    // Check if category already exists (excluding current one)
    const existing = await db.get('SELECT * FROM categories WHERE name = ? AND id != ?', [name.trim(), id]);
    if (existing) {
      return res.status(400).json({ error: 'Category already exists' });
    }
    
    const result = await db.run(
      'UPDATE categories SET name = ?, description = ?, updated_at = ? WHERE id = ?',
      [name.trim(), description || null, new Date().toISOString(), id]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    const updatedCategory = await db.get('SELECT * FROM categories WHERE id = ?', [id]);
    res.json({ success: true, category: updatedCategory });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete category (admin only)
app.delete('/api/categories/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user is admin
    const user = await db.get('SELECT * FROM users WHERE id = ?', [req.session.userId]);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    // Check if category is being used by any shoots
    const shootsUsingCategory = await db.get('SELECT COUNT(*) as count FROM shoots WHERE category_id = ?', [id]);
    if (shootsUsingCategory.count > 0) {
      return res.status(400).json({ error: 'Cannot delete category that is being used by shoots' });
    }
    
    const result = await db.run('DELETE FROM categories WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===================================
// Pricing Routes
// ===================================

// Get all pricing data
app.get('/api/pricing', async (req, res) => {
  try {
    // Get packages from database
    const packages = await db.all('SELECT * FROM pricing_packages ORDER BY id');
    
    // Get addons from database
    const addOns = await db.all('SELECT * FROM pricing_addons ORDER BY id');
    
    // Parse JSON fields for packages
    const formattedPackages = packages.map(pkg => ({
      ...pkg,
      features: pkg.features ? JSON.parse(pkg.features) : [],
      recommended: pkg.recommended === 1 || pkg.recommended === true || pkg.recommended === '1'
    }));
    
    res.json({
      packages: formattedPackages,
      addOns: addOns
    });
  } catch (error) {
    console.error('Get pricing error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Middleware to check admin role
function requireAuth(req, res, next) {
  console.log('requireAuth - Session exists:', !!req.session);
  console.log('requireAuth - Session userId:', req.session?.userId);
  console.log('requireAuth - Session ID:', req.sessionID);
  
  if (!req.session.userId) {
    console.error('requireAuth - FAILED: No userId in session');
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  console.log('requireAuth - PASSED');
  next();
}

function requireAdmin(req, res, next) {
  console.log('🔐 Admin check:', {
    sessionID: req.sessionID,
    userId: req.session?.userId,
    userRole: req.session?.userRole,
    hasSession: !!req.session
  });
  
  if (!req.session.userId || req.session.userRole !== 'admin') {
    console.log('❌ Admin access denied');
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  console.log('✅ Admin access granted');
  next();
}

// Update package (admin only)
app.put('/api/pricing/packages/:id', requireAdmin, async (req, res) => {
  try {
    const packageId = parseInt(req.params.id);
    const { name, description, price, features, duration, recommended } = req.body;

    const result = await db.run(
      `UPDATE pricing_packages 
       SET name = ?, description = ?, price = ?, duration = ?, features = ?, recommended = ?, updated_at = ?
       WHERE id = ?`,
      [
        name,
        description || '',
        price,
        duration || '',
        db.stringifyJSONField(features || []),
        recommended ? 1 : 0,
        new Date().toISOString(),
        packageId
      ]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Package not found' });
    }

    const updatedPackage = await db.get('SELECT * FROM pricing_packages WHERE id = ?', [packageId]);
    
    // Format the package for response
    const formattedPackage = {
      ...updatedPackage,
      features: updatedPackage.features ? JSON.parse(updatedPackage.features) : [],
      recommended: updatedPackage.recommended === 1 || updatedPackage.recommended === true
    };

    res.json({ success: true, package: formattedPackage });
  } catch (error) {
    console.error('Update package error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add package (admin only)
app.post('/api/pricing/packages', requireAdmin, async (req, res) => {
  try {
    const { name, description, price, features, duration, recommended } = req.body;

    const result = await db.run(
      `INSERT INTO pricing_packages (name, description, price, duration, features, recommended, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description || '',
        price,
        duration || '',
        db.stringifyJSONField(features || []),
        recommended ? 1 : 0,
        new Date().toISOString(),
        new Date().toISOString()
      ]
    );

    const newPackage = await db.get('SELECT * FROM pricing_packages WHERE id = ?', [result.id]);
    
    // Format the package for response
    const formattedPackage = {
      ...newPackage,
      features: newPackage.features ? JSON.parse(newPackage.features) : [],
      recommended: newPackage.recommended === 1 || newPackage.recommended === true
    };

    res.json({ success: true, package: formattedPackage });
  } catch (error) {
    console.error('Create package error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete package (admin only)
app.delete('/api/pricing/packages/:id', requireAdmin, async (req, res) => {
  try {
    const packageId = parseInt(req.params.id);

    const result = await db.run('DELETE FROM pricing_packages WHERE id = ?', [packageId]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Package not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete package error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update add-on (admin only)
app.put('/api/pricing/addons/:id', requireAdmin, async (req, res) => {
  try {
    const addonId = parseInt(req.params.id);
    const { name, description, price } = req.body;

    const result = await db.run(
      'UPDATE pricing_addons SET name = ?, description = ?, price = ?, updated_at = ? WHERE id = ?',
      [name, description, price, new Date().toISOString(), addonId]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Add-on not found' });
    }

    const updatedAddon = await db.get('SELECT * FROM pricing_addons WHERE id = ?', [addonId]);

    res.json({ success: true, addon: updatedAddon });
  } catch (error) {
    console.error('Update add-on error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add add-on (admin only)
app.post('/api/pricing/addons', requireAdmin, async (req, res) => {
  try {
    const { name, description, price } = req.body;

    const result = await db.run(
      `INSERT INTO pricing_addons (name, description, price, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [name, description, price, new Date().toISOString(), new Date().toISOString()]
    );

    const newAddon = await db.get('SELECT * FROM pricing_addons WHERE id = ?', [result.id]);

    res.json({ success: true, addon: newAddon });
  } catch (error) {
    console.error('Add add-on error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete add-on (admin only)
app.delete('/api/pricing/addons/:id', requireAdmin, async (req, res) => {
  try {
    const addonId = parseInt(req.params.id);

    const result = await db.run('DELETE FROM pricing_addons WHERE id = ?', [addonId]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Add-on not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete add-on error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===================================
// Bookings/Sessions Routes
// ===================================

// Get all bookings (admin sees all, users see only theirs)
app.get('/api/bookings', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    let bookings;
    
    if (req.session.userRole === 'admin') {
      // Admin sees all bookings
      bookings = await db.all(`
        SELECT b.*, u.email as user_email, u.name as user_name
        FROM bookings b
        LEFT JOIN users u ON b.user_id = u.id
        ORDER BY b.created_at DESC
      `);
    } else {
      // Users see only their own bookings
      bookings = await db.all(
        'SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC',
        [req.session.userId]
      );
    }
    
    res.json({ bookings });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single booking by ID (admin only)
app.get('/api/bookings/:id', requireAdmin, async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    
    const booking = await db.get('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json({ booking });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create booking (users and admin)
app.post('/api/bookings', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { sessionType, date, time, location, notes, clientName, clientEmail, packageId } = req.body;
    
    if (!sessionType || !date) {
      return res.status(400).json({ error: 'Session type and date required' });
    }

    // Get user info from database
    const user = await db.get('SELECT * FROM users WHERE id = ?', [req.session.userId]);
    
    const result = await db.run(
      `INSERT INTO bookings (client_name, client_email, user_id, session_type, date, time, location, notes, status, package_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        clientName || user?.name || 'Unknown',
        clientEmail || user?.email || 'unknown@email.com',
        req.session.userId,
        sessionType,
        date,
        time || '',
        location || '',
        notes || '',
        'pending',
        packageId || null,
        new Date().toISOString(),
        new Date().toISOString()
      ]
    );
    
    const newBooking = await db.get('SELECT * FROM bookings WHERE id = ?', [result.id]);
    
    res.json({ success: true, booking: newBooking });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update booking (admin only)
app.put('/api/bookings/:id', requireAdmin, async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const updates = req.body;
    
    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    
    const allowedFields = ['client_name', 'client_email', 'session_type', 'date', 'time', 'location', 'notes', 'status'];
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    updateValues.push(new Date().toISOString()); // updated_at
    updateValues.push(bookingId);
    
    const result = await db.run(
      `UPDATE bookings SET ${updateFields.join(', ')}, updated_at = ? WHERE id = ?`,
      updateValues
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    const updatedBooking = await db.get('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    
    res.json({ success: true, booking: updatedBooking });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update booking status (admin only)
app.put('/api/bookings/:id/status', requireAdmin, async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const { status } = req.body;
    
    const result = await db.run('UPDATE bookings SET status = ?, updated_at = ? WHERE id = ?', [status, new Date().toISOString(), bookingId]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    const updatedBooking = await db.get('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    res.json({ success: true, booking: updatedBooking });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete booking (admin only)
// Allow clients to delete their own pending bookings, or admins to delete any booking
app.delete('/api/bookings/:id', requireAuth, async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    
    // Get the booking first
    const booking = await db.get('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Check if user is admin
    const user = await db.get('SELECT role FROM users WHERE id = ?', [req.session.userId]);
    const isAdmin = user && user.role === 'admin';
    
    // If not admin, check if this is the user's booking and it's still pending
    if (!isAdmin) {
      if (booking.user_id !== req.session.userId) {
        return res.status(403).json({ error: 'Not authorized to delete this booking' });
      }
      
      // Users can only delete pending bookings
      if (booking.status.toLowerCase() !== 'pending') {
        return res.status(403).json({ error: 'Can only delete pending bookings' });
      }
    }
    
    const result = await db.run('DELETE FROM bookings WHERE id = ?', [bookingId]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    console.log(`Booking ${bookingId} deleted by ${isAdmin ? 'admin' : 'user'}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===================================
// Invoices Routes
// ===================================

// Get all invoices (admin only)
app.get('/api/invoices', requireAdmin, async (req, res) => {
  try {
    const invoices = await db.all('SELECT * FROM invoices ORDER BY created_at DESC');
    res.json({ invoices });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create invoice (admin only)
app.post('/api/invoices', requireAdmin, async (req, res) => {
  try {
    const { clientName, clientEmail, amount, status, date, items, bookingId } = req.body;
    
    if (!clientName || !amount) {
      return res.status(400).json({ error: 'Client name and amount required' });
    }
    
    const result = await db.run(
      `INSERT INTO invoices (booking_id, amount, description, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        bookingId || null,
        parseFloat(amount),
        `Invoice for ${clientName}`,
        status || 'pending',
        new Date().toISOString(),
        new Date().toISOString()
      ]
    );
    
    const newInvoice = await db.get('SELECT * FROM invoices WHERE id = ?', [result.id]);
    
    // If linked to booking, update booking status
    if (bookingId) {
      await db.run('UPDATE bookings SET status = ?, updated_at = ? WHERE id = ?', ['invoiced', new Date().toISOString(), bookingId]);
    }
    
    res.json({ success: true, invoice: newInvoice });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update invoice (admin only)
app.put('/api/invoices/:id', requireAdmin, async (req, res) => {
  try {
    const invoiceId = parseInt(req.params.id);
    const updates = req.body;
    
    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    
    const allowedFields = ['amount', 'description', 'status'];
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    updateValues.push(new Date().toISOString()); // updated_at
    updateValues.push(invoiceId);
    
    const result = await db.run(
      `UPDATE invoices SET ${updateFields.join(', ')}, updated_at = ? WHERE id = ?`,
      updateValues
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    const updatedInvoice = await db.get('SELECT * FROM invoices WHERE id = ?', [invoiceId]);
    
    res.json({ success: true, invoice: updatedInvoice });
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete invoice (admin only)
app.delete('/api/invoices/:id', requireAdmin, async (req, res) => {
  try {
    const invoiceId = parseInt(req.params.id);
    const result = await db.run('DELETE FROM invoices WHERE id = ?', [invoiceId]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===================================
// Expenses Routes
// ===================================

// Get all expenses (admin only)
app.get('/api/expenses', requireAdmin, async (req, res) => {
  try {
    const expenses = await db.all('SELECT * FROM expenses ORDER BY created_at DESC');
    res.json({ expenses });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create expense (admin only)
app.post('/api/expenses', requireAdmin, async (req, res) => {
  try {
    const { category, description, amount, date } = req.body;
    
    if (!category || !description || !amount) {
      return res.status(400).json({ error: 'Category, description, and amount required' });
    }
    
    const result = await db.run(
      `INSERT INTO expenses (description, amount, category, date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        description,
        parseFloat(amount),
        category,
        date || new Date().toISOString().split('T')[0],
        new Date().toISOString(),
        new Date().toISOString()
      ]
    );
    
    const newExpense = await db.get('SELECT * FROM expenses WHERE id = ?', [result.id]);
    
    res.json({ success: true, expense: newExpense });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update expense (admin only)
app.put('/api/expenses/:id', requireAdmin, async (req, res) => {
  try {
    const expenseId = parseInt(req.params.id);
    const updates = req.body;
    
    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    
    const allowedFields = ['description', 'amount', 'category', 'date'];
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    updateValues.push(new Date().toISOString()); // updated_at
    updateValues.push(expenseId);
    
    const result = await db.run(
      `UPDATE expenses SET ${updateFields.join(', ')}, updated_at = ? WHERE id = ?`,
      updateValues
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    const updatedExpense = await db.get('SELECT * FROM expenses WHERE id = ?', [expenseId]);
    
    res.json({ success: true, expense: updatedExpense });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete expense (admin only)
app.delete('/api/expenses/:id', requireAdmin, async (req, res) => {
  try {
    const expenseId = parseInt(req.params.id);
    
    const result = await db.run('DELETE FROM expenses WHERE id = ?', [expenseId]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get or create category by name (for shoot creation)
app.post('/api/categories/get-or-create', requireAuth, async (req, res) => {
  try {
    const { name } = req.body;
    
    // Check if user is admin
    const user = await db.get('SELECT * FROM users WHERE id = ?', [req.session.userId]);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Category name is required' });
    }
    
    const categoryName = name.trim();
    
    // Check if category already exists
    let category = await db.get('SELECT * FROM categories WHERE name = ?', [categoryName]);
    
    if (!category) {
      // Create new category
      const result = await db.run(
        'INSERT INTO categories (name, description, created_at, updated_at) VALUES (?, ?, ?, ?)',
        [categoryName, null, new Date().toISOString(), new Date().toISOString()]
      );
      
      category = await db.get('SELECT * FROM categories WHERE id = ?', [result.id]);
    }
    
    res.json({ success: true, category });
  } catch (error) {
    console.error('Get or create category error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===================================
// Portfolio/Shoots Routes
// ===================================

// Get all shoots and categories
app.get('/api/portfolio', async (req, res) => {
  try {
    console.log('📸 Portfolio request received');
    
    // Get all shoots and filter by is_hidden in JavaScript (since Supabase SQL parser is limited)
    const allShoots = await db.all('SELECT * FROM shoots ORDER BY created_at DESC');
    // Filter out hidden shoots in JavaScript
    const shoots = allShoots.filter(shoot => !shoot.is_hidden || shoot.is_hidden === 0 || shoot.is_hidden === false);
    console.log(`📸 Found ${shoots.length} visible shoots in database (out of ${allShoots.length} total)`);

    // Get photos for each shoot and fetch category separately
    const shootsWithPhotos = await Promise.all(shoots.map(async (shoot) => {
      // Get all photos and filter by is_hidden in JavaScript (since Supabase SQL parser is limited)
      const allPhotos = await db.all('SELECT * FROM photos WHERE shoot_id = ?', [shoot.id]);
      // Filter out hidden photos in JavaScript
      const photos = allPhotos.filter(photo => !photo.is_hidden || photo.is_hidden === 0 || photo.is_hidden === false);
      
      // Fetch category information separately since LEFT JOIN doesn't work with Supabase wrapper
      let categoryName = 'Uncategorized'
      if (shoot.category_id) {
        try {
          const category = await db.get('SELECT * FROM categories WHERE id = ?', [shoot.category_id])
          if (category && category.name) {
            categoryName = category.name
          }
        } catch (error) {
          console.error(`Error fetching category for shoot ${shoot.id}:`, error)
        }
      }
      
      console.log(`📸 Shoot "${shoot.title}": category_id=${shoot.category_id}, category_name=${categoryName}`);
      
      return {
        id: shoot.id,
        title: shoot.title,
        description: shoot.description,
        category: categoryName,
        category_id: shoot.category_id,
        date: shoot.date,
        authorized_emails: shoot.authorized_emails,
        download_stats: shoot.download_stats,
        high_res_deleted_at: shoot.high_res_deleted_at,
        created_at: shoot.created_at,
        updated_at: shoot.updated_at,
        authorizedEmails: db.parseJSONField(shoot.authorized_emails) || [],
        downloadStats: db.parseJSONField(shoot.download_stats) || {},
        photos: photos.map(photo => ({
          id: photo.id,
          original_name: photo.original_name,
          filename: photo.filename,
          display_url: photo.display_url,
          download_url: photo.download_url,
          display_key: photo.display_key,
          download_key: photo.download_key,
          original_size: photo.original_size,
          compressed_size: photo.compressed_size,
          has_high_res: photo.has_high_res,
          uploaded_at: photo.uploaded_at,
          featured: photo.featured,
          // Add camelCase versions for frontend compatibility
          displayUrl: photo.display_url,
          downloadUrl: photo.download_url,
          displayKey: photo.display_key,
          downloadKey: photo.download_key,
          originalSize: photo.original_size,
          compressedSize: photo.compressed_size,
          hasHighRes: photo.has_high_res,
          uploadedAt: photo.uploaded_at
        }))
      };
    }));

    // Get unique categories from shoots (not from pricing_categories table)
    const categorySet = new Set()
    shootsWithPhotos.forEach(shoot => {
      if (shoot.category) {
        categorySet.add(shoot.category)
      }
    })
    const categories = Array.from(categorySet).sort()
    console.log(`📸 Found ${categories.length} unique categories in shoots`);

    console.log('📸 Portfolio data processed successfully');

    res.json({
      shoots: shootsWithPhotos,
      categories: categories
    });
  } catch (error) {
    console.error('Get portfolio error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's authorized shoots (any authenticated user)
app.get('/api/portfolio/my-shoots', requireAuth, async (req, res) => {
  try {
    // Get user email
    const user = await db.get('SELECT email FROM users WHERE id = ?', [req.session.userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get all shoots
    const allShoots = await db.all('SELECT * FROM shoots ORDER BY created_at DESC');
    
    // Filter shoots where user's email is in authorized_emails
    const authorizedShoots = [];
    
    for (const shoot of allShoots) {
      const authorizedEmails = db.parseJSONField(shoot.authorized_emails) || [];
      if (authorizedEmails.includes(user.email.toLowerCase())) {
        // Get photos for this shoot
        const photos = await db.all('SELECT * FROM photos WHERE shoot_id = ? ORDER BY uploaded_at DESC', [shoot.id]);
        
        // Get category name if exists
        let categoryName = 'Uncategorized'
        if (shoot.category_id) {
          try {
            const category = await db.get('SELECT * FROM categories WHERE id = ?', [shoot.category_id])
            if (category && category.name) {
              categoryName = category.name
            }
          } catch (error) {
            console.error(`Error fetching category for shoot ${shoot.id}:`, error)
          }
        }

        authorizedShoots.push({
          id: shoot.id,
          title: shoot.title,
          description: shoot.description,
          category: categoryName,
          date: shoot.date,
          photos: photos.map(photo => ({
            id: photo.id,
            displayUrl: photo.display_url,
            downloadUrl: photo.download_url,
            hasHighRes: photo.has_high_res
          })),
          createdAt: shoot.created_at,
          updatedAt: shoot.updated_at
        });
      }
    }

    res.json({ shoots: authorizedShoots });
  } catch (error) {
    console.error('Get my shoots error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get shoots by category
app.get('/api/portfolio/category/:category', async (req, res) => {
  try {
    const category = req.params.category;
    
    let allShoots;
    if (category === 'all') {
      allShoots = await db.all('SELECT * FROM shoots ORDER BY created_at DESC');
    } else {
      allShoots = await db.all('SELECT * FROM shoots WHERE LOWER(category) = LOWER(?) ORDER BY created_at DESC', [category]);
    }
    // Filter out hidden shoots in JavaScript (since Supabase SQL parser doesn't handle complex WHERE clauses)
    const shoots = allShoots.filter(shoot => !shoot.is_hidden || shoot.is_hidden === 0 || shoot.is_hidden === false);
    
    // Get photos for each shoot (only non-hidden photos)
    const shootsWithPhotos = await Promise.all(shoots.map(async (shoot) => {
      // Get all photos and filter by is_hidden in JavaScript (since Supabase SQL parser is limited)
      const allPhotos = await db.all('SELECT * FROM photos WHERE shoot_id = ?', [shoot.id]);
      // Filter out hidden photos in JavaScript
      const photos = allPhotos.filter(photo => !photo.is_hidden || photo.is_hidden === 0 || photo.is_hidden === false);
      return {
        id: shoot.id,
        title: shoot.title,
        description: shoot.description,
        category: shoot.category,
        date: shoot.date,
        photos: photos.map(photo => ({
          id: photo.id,
          original_name: photo.original_name,
          filename: photo.filename,
          display_url: photo.display_url,
          download_url: photo.download_url,
          display_key: photo.display_key,
          download_key: photo.download_key,
          original_size: photo.original_size,
          compressed_size: photo.compressed_size,
          has_high_res: photo.has_high_res,
          uploaded_at: photo.uploaded_at,
          featured: photo.featured,
          // Add camelCase versions for frontend compatibility
          displayUrl: photo.display_url,
          downloadUrl: photo.download_url,
          displayKey: photo.display_key,
          downloadKey: photo.download_key,
          originalSize: photo.original_size,
          compressedSize: photo.compressed_size,
          hasHighRes: photo.has_high_res,
          uploadedAt: photo.uploaded_at
        })),
        authorizedEmails: db.parseJSONField(shoot.authorized_emails) || [],
        downloadStats: db.parseJSONField(shoot.download_stats) || {},
        createdAt: shoot.created_at,
        updatedAt: shoot.updated_at
      };
    }));
    
    res.json({ shoots: shootsWithPhotos });
  } catch (error) {
    console.error('Get shoots by category error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all shoots for admin (including hidden ones)
app.get('/api/admin/portfolio', requireAdmin, async (req, res) => {
  try {
    console.log('📸 Admin portfolio request received');
    
    // Get ALL shoots (including hidden ones) for admin view
    const shoots = await db.all('SELECT * FROM shoots ORDER BY created_at DESC');
    console.log(`📸 Found ${shoots.length} total shoots (including hidden) in database`);

    // Get photos for each shoot (including hidden photos for admin)
    const shootsWithPhotos = await Promise.all(shoots.map(async (shoot) => {
      // Get ALL photos (including hidden ones) for admin
      const photos = await db.all('SELECT * FROM photos WHERE shoot_id = ?', [shoot.id]);
      
      // Fetch category information separately since LEFT JOIN doesn't work with Supabase wrapper
      let categoryName = 'Uncategorized'
      if (shoot.category_id) {
        try {
          const category = await db.get('SELECT * FROM categories WHERE id = ?', [shoot.category_id])
          if (category && category.name) {
            categoryName = category.name
          }
        } catch (error) {
          console.error(`Error fetching category for shoot ${shoot.id}:`, error)
        }
      }
      
      return {
        id: shoot.id,
        title: shoot.title,
        description: shoot.description,
        category: categoryName,
        category_id: shoot.category_id,
        date: shoot.date,
        is_hidden: shoot.is_hidden,
        isHidden: shoot.is_hidden, // camelCase for frontend
        authorized_emails: shoot.authorized_emails,
        download_stats: shoot.download_stats,
        high_res_deleted_at: shoot.high_res_deleted_at,
        created_at: shoot.created_at,
        updated_at: shoot.updated_at,
        authorizedEmails: db.parseJSONField(shoot.authorized_emails) || [],
        downloadStats: db.parseJSONField(shoot.download_stats) || {},
        photos: photos.map(photo => ({
          id: photo.id,
          original_name: photo.original_name,
          filename: photo.filename,
          display_url: photo.display_url,
          download_url: photo.download_url,
          display_key: photo.display_key,
          download_key: photo.download_key,
          original_size: photo.original_size,
          compressed_size: photo.compressed_size,
          has_high_res: photo.has_high_res,
          uploaded_at: photo.uploaded_at,
          featured: photo.featured,
          is_hidden: photo.is_hidden,
          isHidden: photo.is_hidden, // camelCase for frontend
          // Add camelCase versions for frontend compatibility
          displayUrl: photo.display_url,
          downloadUrl: photo.download_url,
          displayKey: photo.display_key,
          downloadKey: photo.download_key,
          originalSize: photo.original_size,
          compressedSize: photo.compressed_size,
          hasHighRes: photo.has_high_res,
          uploadedAt: photo.uploaded_at
        }))
      };
    }));

    // Get unique categories from shoots
    const categorySet = new Set()
    shootsWithPhotos.forEach(shoot => {
      if (shoot.category) {
        categorySet.add(shoot.category)
      }
    })
    const categories = Array.from(categorySet).sort()
    console.log(`📸 Found ${categories.length} unique categories in shoots`);

    console.log('📸 Admin portfolio data processed successfully');

    res.json({
      shoots: shootsWithPhotos,
      categories: categories
    });
  } catch (error) {
    console.error('Get admin portfolio error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single shoot
app.get('/api/portfolio/shoots/:id', async (req, res) => {
  try {
    const shootId = parseInt(req.params.id);
    console.log(`📸 Single shoot request for ID: ${shootId}`);
    
    // Get shoot from database
    const shoot = await db.get('SELECT * FROM shoots WHERE id = ?', [shootId]);
    if (!shoot) {
      console.log(`📸 Shoot ${shootId} not found`);
      return res.status(404).json({ error: 'Shoot not found' });
    }
    
    console.log(`📸 Found shoot: ${shoot.title}`);
    
    // Get photos for this shoot
    const photos = await db.all('SELECT * FROM photos WHERE shoot_id = ? ORDER BY uploaded_at DESC', [shootId]);
    console.log(`📸 Found ${photos.length} photos for shoot ${shootId}`);
    
    // Format response to match expected structure
    const shootData = {
      id: shoot.id,
      title: shoot.title,
      description: shoot.description,
      category: shoot.category,
      date: shoot.date,
      photos: photos.map(photo => ({
        id: photo.id,
        original_name: photo.original_name,
        filename: photo.filename,
        display_url: photo.display_url,
        download_url: photo.download_url,
        display_key: photo.display_key,
        download_key: photo.download_key,
        original_size: photo.original_size,
        compressed_size: photo.compressed_size,
        has_high_res: photo.has_high_res,
        uploaded_at: photo.uploaded_at,
        featured: photo.featured,
        // Add camelCase versions for frontend compatibility
        displayUrl: photo.display_url,
        downloadUrl: photo.download_url,
        displayKey: photo.display_key,
        downloadKey: photo.download_key,
        originalSize: photo.original_size,
        compressedSize: photo.compressed_size,
        hasHighRes: photo.has_high_res,
        uploadedAt: photo.uploaded_at
      })),
      authorizedEmails: db.parseJSONField(shoot.authorized_emails) || [],
      downloadStats: db.parseJSONField(shoot.download_stats) || {},
      createdAt: shoot.created_at,
      updatedAt: shoot.updated_at
    };
    
    console.log(`📸 Returning shoot data for: ${shoot.title}`);
    res.json({ shoot: shootData });
  } catch (error) {
    console.error('Get shoot error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new shoot (admin only)
app.post('/api/portfolio/shoots', requireAdmin, async (req, res) => {
  try {
    const { title, description, category, date } = req.body;
    
    if (!title || !category) {
      return res.status(400).json({ error: 'Title and category are required' });
    }
    
    // Get or create category
    let categoryId = null;
    if (typeof category === 'number') {
      // If category is already an ID
      categoryId = category;
    } else {
      // If category is a string, get or create it
      let categoryRecord = await db.get('SELECT * FROM categories WHERE name = ?', [category]);
      if (!categoryRecord) {
        const result = await db.run(
          'INSERT INTO categories (name, description, created_at, updated_at) VALUES (?, ?, ?, ?)',
          [category, null, new Date().toISOString(), new Date().toISOString()]
        );
        categoryRecord = await db.get('SELECT * FROM categories WHERE id = ?', [result.id]);
      }
      categoryId = categoryRecord.id;
    }
    
    const result = await db.run(
      `INSERT INTO shoots (title, description, category_id, date, authorized_emails, download_stats, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description || '',
        categoryId,
        date || new Date().toISOString(),
        db.stringifyJSONField([]), // authorized_emails
        db.stringifyJSONField({}), // download_stats
        new Date().toISOString(),
        new Date().toISOString()
      ]
    );
    
    const newShoot = await db.get('SELECT * FROM shoots WHERE id = ?', [result.id]);

    res.json({ success: true, shoot: newShoot });
  } catch (error) {
    console.error('Create shoot error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update shoot (admin only)
app.put('/api/portfolio/shoots/:id', requireAdmin, async (req, res) => {
  try {
    const shootId = parseInt(req.params.id);
    const { title, description, category, date } = req.body;
    
    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    
    if (title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(title);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (category !== undefined) {
      updateFields.push('category = ?');
      updateValues.push(category);
    }
    if (date !== undefined) {
      updateFields.push('date = ?');
      updateValues.push(date);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    updateFields.push('updated_at = ?');
    updateValues.push(new Date().toISOString());
    updateValues.push(shootId);
    
    const result = await db.run(
      `UPDATE shoots SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Shoot not found' });
    }
    
    // Get updated shoot
    const updatedShoot = await db.get('SELECT * FROM shoots WHERE id = ?', [shootId]);
    const photos = await db.all('SELECT * FROM photos WHERE shoot_id = ?', [shootId]);
    
    const shoot = {
      id: updatedShoot.id,
      title: updatedShoot.title,
      description: updatedShoot.description,
      category: updatedShoot.category,
      date: updatedShoot.date,
      photos: photos.map(photo => ({
        id: photo.id,
        original_name: photo.original_name,
        filename: photo.filename,
        display_url: photo.display_url,
        download_url: photo.download_url,
        display_key: photo.display_key,
        download_key: photo.download_key,
        original_size: photo.original_size,
        compressed_size: photo.compressed_size,
        has_high_res: photo.has_high_res,
        uploaded_at: photo.uploaded_at,
        // Add camelCase versions for frontend compatibility
        displayUrl: photo.display_url,
        downloadUrl: photo.download_url,
        displayKey: photo.display_key,
        downloadKey: photo.download_key,
        originalSize: photo.original_size,
        compressedSize: photo.compressed_size,
        hasHighRes: photo.has_high_res,
        uploadedAt: photo.uploaded_at
      })),
      authorizedEmails: db.parseJSONField(updatedShoot.authorized_emails) || [],
      downloadStats: db.parseJSONField(updatedShoot.download_stats) || {},
      createdAt: updatedShoot.created_at,
      updatedAt: updatedShoot.updated_at
    };

    res.json({ success: true, shoot });
  } catch (error) {
    console.error('Update shoot error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete shoot (admin only)
app.delete('/api/portfolio/shoots/:id', requireAdmin, async (req, res) => {
  try {
    const shootId = parseInt(req.params.id);
    
    // Get shoot and photos from database
    const shoot = await db.get('SELECT * FROM shoots WHERE id = ?', [shootId]);
    if (!shoot) {
      return res.status(404).json({ error: 'Shoot not found' });
    }
    
    const photos = await db.all('SELECT * FROM photos WHERE shoot_id = ?', [shootId]);
    
    // Delete associated photos from storage
    for (const photo of photos) {
      try {
        if (SPACES_ENABLED && s3Client) {
          // Delete compressed version
          if (photo.display_key) {
            await s3Client.deleteObject({
              Bucket: process.env.SPACES_BUCKET,
              Key: photo.display_key
            }).promise();
            console.log(`Deleted compressed from Spaces: ${photo.display_key}`);
          }
          
          // Delete original version if it exists
          if (photo.download_key) {
            await s3Client.deleteObject({
              Bucket: process.env.SPACES_BUCKET,
              Key: photo.download_key
            }).promise();
            console.log(`Deleted original from Spaces: ${photo.download_key}`);
          }
        } else {
          // Delete from local filesystem
          if (photo.filename) {
            const photoPath = path.join(__dirname, 'uploads', photo.filename);
            await fs.unlink(photoPath);
            console.log(`Deleted from local storage: ${photo.filename}`);
          }
        }
      } catch (err) {
        console.error('Error deleting photo:', err);
        // Continue to next photo
      }
    }
    
    // Delete photos from database
    await db.run('DELETE FROM photos WHERE shoot_id = ?', [shootId]);
    
    // Delete shoot from database
    const result = await db.run('DELETE FROM shoots WHERE id = ?', [shootId]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Shoot not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete shoot error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Hide/Unhide shoot (admin only)
app.put('/api/portfolio/shoots/:id/visibility', requireAdmin, async (req, res) => {
  try {
    const shootId = parseInt(req.params.id);
    const { isHidden } = req.body;
    
    console.log('🎯 Toggling shoot visibility:', { shootId, isHidden });
    
    // Check if shoot exists first
    const shoot = await db.get('SELECT * FROM shoots WHERE id = ?', [shootId]);
    if (!shoot) {
      return res.status(404).json({ error: 'Shoot not found' });
    }
    
    // Try to update the is_hidden column
    try {
      const result = await db.run(
        'UPDATE shoots SET is_hidden = ?, updated_at = ? WHERE id = ?',
        [isHidden ? 1 : 0, new Date().toISOString(), shootId]
      );
      
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Shoot not found' });
      }
    } catch (updateError) {
      console.error('Error updating shoot visibility (column may not exist):', updateError);
      // Column might not exist yet, just return success for now
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Toggle shoot visibility error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Hide/Unhide photo (admin only)
app.put('/api/photos/:id/visibility', requireAdmin, async (req, res) => {
  try {
    const photoId = parseInt(req.params.id);
    const { isHidden } = req.body;
    
    console.log('🎯 Toggling photo visibility:', { photoId, isHidden });
    
    // Check if photo exists first
    const photo = await db.get('SELECT * FROM photos WHERE id = ?', [photoId]);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    // Try to update the is_hidden column
    // If it doesn't exist, we'll just ignore it (legacy support)
    try {
      const result = await db.run(
        'UPDATE photos SET is_hidden = ? WHERE id = ?',
        [isHidden ? 1 : 0, photoId]
      );
      
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Photo not found' });
      }
    } catch (updateError) {
      console.error('Error updating photo visibility (column may not exist):', updateError);
      // Column might not exist yet, just return success for now
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Toggle photo visibility error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload photos to shoot (admin only) - WITH DUAL STORAGE
app.post('/api/portfolio/shoots/:id/photos', requireAdmin, (req, res, next) => {
  // Multer middleware with error handling
  upload.array('photos', 20)(req, res, (err) => {
    if (err) {
      console.error('❌ Multer upload error:', err);
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        stack: err.stack
      });
      return res.status(500).json({ 
        error: 'File upload failed', 
        details: err.message,
        spacesEnabled: SPACES_ENABLED 
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    console.log('✅ Files received:', req.files?.length || 0);
    
    const shootId = parseInt(req.params.id);
    
    // Check if shoot exists in database
    const shoot = await db.get('SELECT id FROM shoots WHERE id = ?', [shootId]);
    if (!shoot) {
      return res.status(404).json({ error: 'Shoot not found' });
    }
    
    const newPhotos = [];
    
    // Process each photo with dual storage
    for (const file of req.files) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const filename = `${uniqueSuffix}${ext}`;
      
      let displayUrl, downloadUrl, displayKey, downloadKey;
      let originalSize = file.size;
      let compressedSize = 0;
      
      if (SPACES_ENABLED) {
        try {
          console.log(`📸 Processing ${file.originalname}...`);
          
          // 1. Upload ORIGINAL to Spaces (originals/ folder)
          const originalBuffer = file.buffer;
          downloadUrl = await uploadBufferToSpaces(originalBuffer, 'originals', filename);
          downloadKey = `originals/${filename}`;
          console.log(`   ✅ Original uploaded: ${downloadKey}`);
          
          // 2. Create COMPRESSED version using Sharp
          const compressedBuffer = await sharp(originalBuffer)
            .resize(1920, null, { 
              withoutEnlargement: true,
              fit: 'inside'
            })
            .jpeg({ 
              quality: 85,
              progressive: true,
              mozjpeg: true
            })
            .toBuffer();
          
          compressedSize = compressedBuffer.length;
          console.log(`   ✅ Compressed: ${(originalSize / 1024 / 1024).toFixed(2)}MB → ${(compressedSize / 1024 / 1024).toFixed(2)}MB (${Math.round(compressedSize / originalSize * 100)}%)`);
          
          // 3. Upload COMPRESSED to Spaces (portfolio/ folder)
          displayUrl = await uploadBufferToSpaces(compressedBuffer, 'portfolio', filename);
          displayKey = `portfolio/${filename}`;
          console.log(`   ✅ Compressed uploaded: ${displayKey}`);
          
        } catch (error) {
          console.error(`❌ Error processing ${file.originalname}:`, error);
          throw error;
        }
      } else {
        // Local storage - just save as-is (no compression for local dev)
        displayUrl = `/uploads/${filename}`;
        downloadUrl = displayUrl; // Same file for local
        displayKey = filename;
        downloadKey = filename;
        compressedSize = originalSize;
      }
      
      // Insert photo into database
      const result = await db.run(
        `INSERT INTO photos (shoot_id, original_name, filename, display_url, download_url, display_key, download_key, original_size, compressed_size, has_high_res, featured, uploaded_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          shootId,
          file.originalname,
          filename,
          displayUrl,
          downloadUrl,
          displayKey,
          downloadKey,
          originalSize,
          compressedSize,
          true, // hasHighRes
          0, // featured - default to FALSE (0)
          new Date().toISOString()
        ]
      );
      
      newPhotos.push({
        id: result.id,
        original_name: file.originalname,
        filename: filename,
        display_url: displayUrl,      // Compressed version for web display
        download_url: downloadUrl,     // Original for downloads
        display_key: displayKey,       // S3 key for compressed
        download_key: downloadKey,     // S3 key for original
        original_size: originalSize,
        compressed_size: compressedSize,
        has_high_res: true,
        featured: false,              // Always FALSE on upload
        uploaded_at: new Date().toISOString()
      });
    }
    
    console.log(`✅ ${newPhotos.length} photos saved to database`);
    res.json({ 
      success: true, 
      photos: newPhotos,
      message: `${newPhotos.length} photos uploaded successfully with dual storage`
    });
  } catch (error) {
    console.error('❌ Upload photos error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      details: error.message 
    });
  }
});

// Delete photo from shoot (admin only) - UPDATED for dual storage
app.delete('/api/portfolio/shoots/:shootId/photos/:photoId', requireAdmin, async (req, res) => {
  try {
    const shootId = parseInt(req.params.shootId);
    const photoId = parseInt(req.params.photoId);
    
    // Get photo from database
    const photo = await db.get('SELECT * FROM photos WHERE id = ? AND shoot_id = ?', [photoId, shootId]);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    // Delete BOTH versions from storage
    try {
      if (SPACES_ENABLED && s3Client) {
        // Delete compressed version
        if (photo.display_key) {
          await s3Client.deleteObject({
            Bucket: process.env.SPACES_BUCKET,
            Key: photo.display_key
          }).promise();
          console.log(`Deleted compressed: ${photo.display_key}`);
        }
        
        // Delete original version (if exists)
        if (photo.download_key && photo.has_high_res) {
          await s3Client.deleteObject({
            Bucket: process.env.SPACES_BUCKET,
            Key: photo.download_key
          }).promise();
          console.log(`Deleted original: ${photo.download_key}`);
        }
      } else {
        // Delete from local filesystem
        const photoPath = path.join(__dirname, 'uploads', photo.filename);
        await fs.unlink(photoPath);
        console.log(`Deleted from local storage`);
      }
    } catch (err) {
      console.error('Error deleting file:', err);
      // Continue anyway to remove from database
    }
    
    // Remove from database
    await db.run('DELETE FROM photos WHERE id = ?', [photoId]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===================================
// Email Management & Download Routes
// ===================================

// Add authorized emails to shoot (admin only)
app.post('/api/portfolio/shoots/:id/authorized-emails', requireAdmin, async (req, res) => {
  try {
    const shootId = parseInt(req.params.id);
    const { emails } = req.body;
    
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ error: 'Emails array required' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emails.filter(email => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      return res.status(400).json({ 
        error: 'Invalid email format', 
        invalidEmails 
      });
    }
    
    // Get current shoot
    const shoot = await db.get('SELECT * FROM shoots WHERE id = ?', [shootId]);
    if (!shoot) {
      return res.status(404).json({ error: 'Shoot not found' });
    }
    
    // Get current authorized emails
    const currentEmails = db.parseJSONField(shoot.authorized_emails) || [];
    
    // Add new emails (avoid duplicates)
    const newEmails = emails.filter(email => !currentEmails.includes(email.toLowerCase()));
    const updatedEmails = [...currentEmails, ...newEmails.map(e => e.toLowerCase())];
    
    // Update shoot with new authorized emails
    await db.run(
      'UPDATE shoots SET authorized_emails = ?, updated_at = ? WHERE id = ?',
      [db.stringifyJSONField(updatedEmails), new Date().toISOString(), shootId]
    );
    
    res.json({ 
      success: true, 
      authorizedEmails: updatedEmails,
      added: newEmails.length
    });
  } catch (error) {
    console.error('Add authorized emails error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove authorized email from shoot (admin only)
app.delete('/api/portfolio/shoots/:id/authorized-emails/:email', requireAdmin, async (req, res) => {
  try {
    const shootId = parseInt(req.params.id);
    const emailToRemove = req.params.email.toLowerCase();
    
    // Get current shoot
    const shoot = await db.get('SELECT * FROM shoots WHERE id = ?', [shootId]);
    if (!shoot) {
      return res.status(404).json({ error: 'Shoot not found' });
    }
    
    // Get current authorized emails
    const currentEmails = db.parseJSONField(shoot.authorized_emails) || [];
    const updatedEmails = currentEmails.filter(email => email !== emailToRemove);
    
    // Update shoot with updated authorized emails
    await db.run(
      'UPDATE shoots SET authorized_emails = ?, updated_at = ? WHERE id = ?',
      [db.stringifyJSONField(updatedEmails), new Date().toISOString(), shootId]
    );
    
    res.json({ 
      success: true, 
      authorizedEmails: updatedEmails
    });
  } catch (error) {
    console.error('Remove authorized email error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get authorized emails for shoot (admin only)
app.get('/api/portfolio/shoots/:id/authorized-emails', requireAdmin, async (req, res) => {
  try {
    const shootId = parseInt(req.params.id);
    const shoot = await db.get('SELECT * FROM shoots WHERE id = ?', [shootId]);
    
    if (!shoot) {
      return res.status(404).json({ error: 'Shoot not found' });
    }
    
    const authorizedEmails = db.parseJSONField(shoot.authorized_emails) || [];
    
    res.json({ 
      authorizedEmails: authorizedEmails,
      shootTitle: shoot.title
    });
  } catch (error) {
    console.error('Get authorized emails error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send notification email to authorized user (admin only)
app.post('/api/portfolio/shoots/:id/notify-user', requireAdmin, async (req, res) => {
  try {
    const shootId = parseInt(req.params.id);
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Get shoot from database
    const shoot = await db.get('SELECT * FROM shoots WHERE id = ?', [shootId]);
    if (!shoot) {
      return res.status(404).json({ error: 'Shoot not found' });
    }
    
    // Check if email is authorized
    const authorizedEmails = db.parseJSONField(shoot.authorized_emails) || [];
    if (!authorizedEmails.includes(email.toLowerCase())) {
      return res.status(403).json({ error: 'Email is not authorized for this shoot' });
    }
    
    // Check if email is configured
    if (!transporter) {
      console.log('⚠️  Email not configured - notification not sent');
      return res.status(503).json({ error: 'Email service not configured' });
    }
    
    // Send notification email
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: `Your ${shoot.title} Photos Are Ready! 📸`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4E2E3A;">Your Photos Are Ready! 📸</h2>
            <p>Hello!</p>
            <p>Great news! Your photos from <strong>${shoot.title}</strong> are now ready for you to view and download.</p>
            <p>You can access your photos by logging into your account on our website.</p>
            <div style="background-color: #DFD08F; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #4E2E3A; margin-top: 0;">Next Steps:</h3>
              <ol style="color: #4E2E3A;">
                <li>Log in to your account</li>
                <li>Go to your Dashboard</li>
                <li>Click on the "Photos" tab</li>
                <li>View and download your high-resolution photos!</li>
              </ol>
            </div>
            <p>If you have any questions, please don't hesitate to reach out to us.</p>
            <p>Best regards,<br>The Skylit Photography Team</p>
          </div>
        `
      });
      
      console.log(`📧 Notification email sent to ${email} for shoot "${shoot.title}"`);
      res.json({ success: true, message: 'Notification email sent successfully' });
    } catch (emailError) {
      console.error('Email send error:', emailError);
      res.status(500).json({ error: 'Failed to send notification email' });
    }
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Check if current user has access to shoot (any authenticated user)
app.get('/api/portfolio/shoots/:id/has-access', requireAuth, async (req, res) => {
  try {
    const shootId = parseInt(req.params.id);
    
    // Get shoot from database
    const shoot = await db.get('SELECT * FROM shoots WHERE id = ?', [shootId]);
    if (!shoot) {
      return res.status(404).json({ error: 'Shoot not found' });
    }
    
    // Admin always has access
    if (req.session.userRole === 'admin') {
      return res.json({ hasAccess: true, isAdmin: true });
    }
    
    // Get user email from database
    const user = await db.get('SELECT email FROM users WHERE id = ?', [req.session.userId]);
    if (!user) {
      return res.json({ hasAccess: false });
    }
    
    // Check if user email is in authorized list
    const authorizedEmails = db.parseJSONField(shoot.authorized_emails) || [];
    const hasAccess = authorizedEmails.includes(user.email.toLowerCase());
    
    // Check if shoot has high-res photos
    const photosWithHighRes = await db.get('SELECT COUNT(*) as count FROM photos WHERE shoot_id = ? AND has_high_res = 1', [shootId]);
    const hasHighRes = photosWithHighRes.count > 0;
    
    res.json({ 
      hasAccess,
      hasHighRes
    });
  } catch (error) {
    console.error('Check access error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Download high-res photo (authenticated users with permission)
app.get('/api/photos/:photoId/download', requireAuth, async (req, res) => {
  try {
    const photoId = parseInt(req.params.photoId);
    
    // Get photo and its shoot from database
    const photo = await db.get('SELECT * FROM photos WHERE id = ?', [photoId]);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    const shoot = await db.get('SELECT * FROM shoots WHERE id = ?', [photo.shoot_id]);
    if (!shoot) {
      return res.status(404).json({ error: 'Shoot not found' });
    }
    
    // Check if high-res exists
    if (!photo.has_high_res) {
      return res.status(410).json({ 
        error: 'High-resolution version no longer available'
      });
    }
    
    // Check permissions
    const isAdmin = req.session.userRole === 'admin';
    
    if (!isAdmin) {
      // Get user email from database
      const user = await db.get('SELECT email FROM users WHERE id = ?', [req.session.userId]);
      if (!user) {
        return res.status(403).json({ error: 'User not found' });
      }
      
      // Check if user is authorized
      const authorizedEmails = db.parseJSONField(shoot.authorized_emails) || [];
      if (!authorizedEmails.includes(user.email.toLowerCase())) {
        return res.status(403).json({ error: 'Not authorized to download this photo' });
      }
    }
    
    // Track download
    const downloadStats = db.parseJSONField(shoot.download_stats) || { totalDownloads: 0, downloadHistory: [] };
    const user = await db.get('SELECT email FROM users WHERE id = ?', [req.session.userId]);
    
    downloadStats.totalDownloads++;
    downloadStats.downloadHistory.push({
      photoId: photoId,
      userEmail: user?.email || 'unknown',
      downloadedAt: new Date().toISOString()
    });
    
    // Keep only last 100 downloads
    if (downloadStats.downloadHistory.length > 100) {
      downloadStats.downloadHistory = downloadStats.downloadHistory.slice(-100);
    }
    
    // Update download stats in database
    await db.run(
      'UPDATE shoots SET download_stats = ?, updated_at = ? WHERE id = ?',
      [db.stringifyJSONField(downloadStats), new Date().toISOString(), shoot.id]
    );
    
    console.log(`📥 Download: ${user?.email} downloaded photo ${photoId} from shoot "${shoot.title}"`);
    
    // Redirect to download URL
    res.redirect(photo.download_url);
  } catch (error) {
    console.error('Download photo error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete high-res versions for a shoot (admin only)
app.delete('/api/portfolio/shoots/:id/originals', requireAdmin, async (req, res) => {
  try {
    const shootId = parseInt(req.params.id);
    // Get shoot from database
    const shoot = await db.get('SELECT * FROM shoots WHERE id = ?', [shootId]);
    if (!shoot) {
      return res.status(404).json({ error: 'Shoot not found' });
    }
    
    // Get photos for this shoot
    const photos = await db.all('SELECT * FROM photos WHERE shoot_id = ? AND has_high_res = 1', [shootId]);
    
    let deletedCount = 0;
    let freedSpace = 0;
    
    // Delete original files from Spaces
    if (SPACES_ENABLED && s3Client) {
      for (const photo of photos) {
        if (photo.download_key) {
          try {
            await s3Client.deleteObject({
              Bucket: process.env.SPACES_BUCKET,
              Key: photo.download_key
            }).promise();
            
            freedSpace += photo.original_size || 0;
            deletedCount++;
            console.log(`🗑️  Deleted original: ${photo.download_key}`);
          } catch (err) {
            console.error(`Error deleting ${photo.download_key}:`, err);
          }
        }
      }
    }
    
    // Update all photos to mark high-res as deleted
    await db.run(
      'UPDATE photos SET has_high_res = 0, download_url = NULL WHERE shoot_id = ?',
      [shootId]
    );
    
    console.log(`✅ Deleted ${deletedCount} original files, freed ${(freedSpace / 1024 / 1024).toFixed(2)}MB`);
    
    res.json({ 
      success: true,
      deletedCount,
      freedSpaceMB: (freedSpace / 1024 / 1024).toFixed(2),
      message: `Deleted ${deletedCount} high-resolution files`
    });
  } catch (error) {
    console.error('Delete originals error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Download all high-res photos from a shoot as ZIP (authenticated users with permission)
app.get('/api/portfolio/shoots/:shootId/download-all', requireAuth, async (req, res) => {
  try {
    const shootId = parseInt(req.params.shootId);
    
    // Get shoot from database
    const shoot = await db.get('SELECT * FROM shoots WHERE id = ?', [shootId]);
    if (!shoot) {
      return res.status(404).json({ error: 'Shoot not found' });
    }
    
    // Check permissions
    const isAdmin = req.session.userRole === 'admin';
    
    if (!isAdmin) {
      // Get user email from database
      const user = await db.get('SELECT email FROM users WHERE id = ?', [req.session.userId]);
      if (!user) {
        return res.status(403).json({ error: 'User not found' });
      }
      
      // Check if user is authorized
      const authorizedEmails = db.parseJSONField(shoot.authorized_emails) || [];
      if (!authorizedEmails.includes(user.email.toLowerCase())) {
        return res.status(403).json({ error: 'Not authorized to download photos from this shoot' });
      }
    }
    
    // Get all high-res photos for this shoot
    const photos = await db.all(
      'SELECT * FROM photos WHERE shoot_id = ? AND has_high_res = 1 AND download_key IS NOT NULL', 
      [shootId]
    );
    
    if (photos.length === 0) {
      return res.status(404).json({ error: 'No high-resolution photos available for this shoot' });
    }
    
    // Set headers for file download
    const sanitizedShootTitle = shoot.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizedShootTitle}_photos.zip"`);
    
    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });
    
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to create zip file' });
      }
    });
    
    archive.pipe(res);
    
    // Download and add each photo to the ZIP
    console.log(`📦 Starting ZIP creation for ${photos.length} photos`);
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      try {
        console.log(`   Adding photo ${i + 1}/${photos.length}: ${photo.original_name || photo.filename}`);
        
        if (SPACES_ENABLED && s3Client) {
          // Download from DigitalOcean Spaces
          const fileData = await s3Client.getObject({
            Bucket: process.env.SPACES_BUCKET,
            Key: photo.download_key
          }).promise();
          
          const fileName = photo.original_name || photo.filename;
          archive.append(fileData.Body, { name: fileName });
        } else {
          // Download from local storage
          const filePath = path.join(__dirname, 'uploads', photo.filename);
          const fileBuffer = await fs.readFile(filePath);
          const fileName = photo.original_name || photo.filename;
          archive.append(fileBuffer, { name: fileName });
        }
        
        console.log(`   ✓ Added photo ${i + 1}/${photos.length}`);
      } catch (err) {
        console.error(`   ✗ Error adding photo ${photo.id} to zip:`, err);
        // Continue with other photos even if one fails
      }
    }
    console.log('✓ All photos added to ZIP');
    
    // Track download
    const downloadStats = db.parseJSONField(shoot.download_stats) || { totalDownloads: 0, downloadHistory: [] };
    const user = await db.get('SELECT email FROM users WHERE id = ?', [req.session.userId]);
    
    downloadStats.totalDownloads += photos.length;
    downloadStats.downloadHistory.push({
      type: 'bulk',
      photoCount: photos.length,
      userEmail: user?.email || 'unknown',
      downloadedAt: new Date().toISOString()
    });
    
    // Keep only last 100 downloads
    if (downloadStats.downloadHistory.length > 100) {
      downloadStats.downloadHistory = downloadStats.downloadHistory.slice(-100);
    }
    
    // Update download stats
    await db.run(
      'UPDATE shoots SET download_stats = ?, updated_at = ? WHERE id = ?',
      [db.stringifyJSONField(downloadStats), new Date().toISOString(), shoot.id]
    );
    
    console.log(`📥 Bulk download: ${user?.email} downloaded ${photos.length} photos from shoot "${shoot.title}"`);
    
    // Finalize the archive
    await archive.finalize();
  } catch (error) {
    console.error('Download all photos error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Server error' });
    }
  }
});

// Get storage statistics (admin only)
app.get('/api/portfolio/storage-stats', requireAdmin, async (req, res) => {
  try {
    // Get stats from database
    const totalPhotos = await db.get('SELECT COUNT(*) as count FROM photos');
    const totalShoots = await db.get('SELECT COUNT(*) as count FROM shoots');
    const photosWithHighRes = await db.get('SELECT COUNT(*) as count FROM photos WHERE has_high_res = 1');
    
    // Get size stats
    const sizeStats = await db.get(`
      SELECT 
        SUM(original_size) as totalOriginalSize,
        SUM(compressed_size) as totalCompressedSize
      FROM photos
    `);
    
    // Get shoots with high-res photos
    const shootsWithHighRes = await db.get(`
      SELECT COUNT(DISTINCT shoot_id) as count 
      FROM photos 
      WHERE has_high_res = 1
    `);
    
    const totalOriginalSize = sizeStats.totalOriginalSize || 0;
    const totalCompressedSize = sizeStats.totalCompressedSize || 0;
    const totalStorageBytes = totalOriginalSize + totalCompressedSize;
    
    // Calculate storage quota (250 GB standard DigitalOcean Spaces plan = 262144000 KB)
    const storageQuotaGB = 250;
    const storageQuotaBytes = storageQuotaGB * 1024 * 1024 * 1024;
    const storageUsedPercent = (totalStorageBytes / storageQuotaBytes) * 100;
    
    res.json({
      totalPhotos: totalPhotos.count,
      totalShoots: totalShoots.count,
      shootsWithHighRes: shootsWithHighRes.count,
      photosWithHighRes: photosWithHighRes.count,
      totalOriginalSizeMB: (totalOriginalSize / 1024 / 1024).toFixed(2),
      totalCompressedSizeMB: (totalCompressedSize / 1024 / 1024).toFixed(2),
      totalStorageMB: (totalStorageBytes / 1024 / 1024).toFixed(2),
      totalStorageGB: (totalStorageBytes / 1024 / 1024 / 1024).toFixed(2),
      storageQuotaGB: storageQuotaGB,
      storageUsedPercent: storageUsedPercent.toFixed(1),
      storageRemainingGB: ((storageQuotaBytes - totalStorageBytes) / 1024 / 1024 / 1024).toFixed(2),
      compressionRatio: totalOriginalSize > 0 ? 
        ((totalCompressedSize / totalOriginalSize) * 100).toFixed(1) + '%' : 'N/A'
    });
  } catch (error) {
    console.error('Get storage stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add/Update categories (admin only)
app.post('/api/portfolio/categories', requireAdmin, async (req, res) => {
  try {
    const { category } = req.body;
    
    if (!category) {
      return res.status(400).json({ error: 'Category name required' });
    }
    
    // Check if category already exists
    const existingCategory = await db.get('SELECT id FROM pricing_categories WHERE name = ?', [category]);
    
    if (!existingCategory) {
      // Add new category
      await db.run('INSERT INTO pricing_categories (name) VALUES (?)', [category]);
    }
    
    // Get all categories
    const categories = await db.all('SELECT name FROM pricing_categories ORDER BY name');
    
    res.json({ success: true, categories: categories.map(c => c.name) });
  } catch (error) {
    console.error('Add category error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===================================
// User Management Routes (Admin Only)
// ===================================

// Get all users (admin only)
app.get('/api/users', requireAdmin, async (req, res) => {
  try {
    const users = await db.all('SELECT id, email, role, status, created_at, updated_at FROM users ORDER BY created_at DESC');
    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get pending users (admin only)
app.get('/api/users/pending', requireAdmin, async (req, res) => {
  try {
    const pendingUsers = await db.all('SELECT id, email, role, status, created_at, updated_at FROM users WHERE status = ? ORDER BY created_at DESC', ['pending']);
    res.json({ users: pendingUsers });
  } catch (error) {
    console.error('Get pending users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Approve user (admin only)
app.put('/api/users/:id/approve', requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    const result = await db.run(
      'UPDATE users SET status = ?, updated_at = ? WHERE id = ?',
      ['approved', new Date().toISOString(), userId]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, message: 'User approved' });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reject user (admin only)
app.put('/api/users/:id/reject', requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    const result = await db.run(
      'UPDATE users SET status = ?, updated_at = ? WHERE id = ?',
      ['rejected', new Date().toISOString(), userId]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, message: 'User rejected' });
  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete user (admin only)
app.delete('/api/users/:id', requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Prevent deleting admin user
    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (user && user.role === 'admin') {
      return res.status(403).json({ error: 'Cannot delete admin user' });
    }
    
    const result = await db.run('DELETE FROM users WHERE id = ?', [userId]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===================================
// Profile Management Routes
// ===================================

// Get current user profile
app.get('/api/profile', requireAuth, async (req, res) => {
  try {
    console.log('Profile request - Session ID:', req.sessionID);
    console.log('Profile request - User ID from session:', req.session.userId);
    
    const user = await db.get('SELECT id, email, phone, role, status, created_at, updated_at FROM users WHERE id = ?', [req.session.userId]);
    
    if (!user) {
      console.error('User not found in database. Session userId:', req.session.userId);
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('Profile retrieved successfully for user:', user.email);
    
    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update email
app.put('/api/profile/update-email', requireAuth, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Check if email is already taken by another user
    const existingUser = await db.get('SELECT id FROM users WHERE email = ? AND id != ?', [email, req.session.userId]);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    
    // Update user email
    const result = await db.run(
      'UPDATE users SET email = ?, updated_at = ? WHERE id = ?',
      [email, new Date().toISOString(), req.session.userId]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, message: 'Email updated successfully' });
  } catch (error) {
    console.error('Update email error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Helper function to format phone number
function formatPhoneNumber(phone) {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If we have 10 digits, format as (xxx)xxx-xxxx
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)})${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  
  // If we have 11 digits and starts with 1, format as (xxx)xxx-xxxx
  if (digits.length === 11 && digits[0] === '1') {
    return `(${digits.slice(1, 4)})${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  
  // Return original if it doesn't match expected patterns
  return phone;
}

// Update phone
app.put('/api/profile/update-phone', requireAuth, async (req, res) => {
  try {
    const { phone } = req.body;
    
    // Format the phone number
    const formattedPhone = formatPhoneNumber(phone);
    
    // Update user phone number
    const result = await db.run(
      'UPDATE users SET phone = ?, updated_at = ? WHERE id = ?',
      [formattedPhone, new Date().toISOString(), req.session.userId]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ 
      success: true, 
      message: 'Phone number updated successfully',
      formattedPhone: formattedPhone
    });
  } catch (error) {
    console.error('Update phone error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update password
app.put('/api/profile/update-password', requireAuth, async (req, res) => {
  try {
    console.log('🔍 Password update debug:', {
      sessionUserId: req.session.userId,
      sessionUserRole: req.session.userRole,
      sessionId: req.sessionID,
      hasSession: !!req.session,
      bodyKeys: Object.keys(req.body || {})
    });
    
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      console.log('❌ Missing password fields');
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }
    
    if (newPassword.length < 6) {
      console.log('❌ Password too short');
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }
    
    // Get user from database
    console.log('🔄 Getting user from database with ID:', req.session.userId);
    const user = await db.get('SELECT password_hash FROM users WHERE id = ?', [req.session.userId]);
    console.log('📊 User query result:', user ? 'User found' : 'User not found');
    
    if (!user) {
      console.error('❌ User not found in database');
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user has a password (Google OAuth users might not)
    if (!user.password_hash) {
      console.log('❌ User has no password hash (Google OAuth)');
      return res.status(400).json({ error: 'Cannot change password for Google-authenticated accounts' });
    }
    
    // Verify current password with bcrypt
    console.log('🔄 Verifying current password...');
    const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!passwordMatch) {
      console.log('❌ Current password incorrect');
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Hash new password before storing
    console.log('🔄 Hashing new password...');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password in database
    console.log('🔄 Updating password for user ID:', req.session.userId);
    const result = await db.run(
      'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?',
      [hashedPassword, new Date().toISOString(), req.session.userId]
    );
    
    console.log('📊 Password update result:', result);
    
    if (result.changes === 0) {
      console.error('❌ No changes made to password');
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('✅ Password updated successfully');
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update name
app.put('/api/profile/update-name', requireAuth, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    if (name.trim().length > 50) {
      return res.status(400).json({ error: 'Name must be 50 characters or less' });
    }
    
    // Update user name
    const result = await db.run(
      'UPDATE users SET name = ?, updated_at = ? WHERE id = ?',
      [name.trim(), new Date().toISOString(), req.session.userId]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, message: 'Name updated successfully' });
  } catch (error) {
    console.error('Update name error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Toggle featured status for a photo
app.put('/api/photos/:id/featured', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { featured } = req.body;
    
    console.log(`🌟 Featured update request: photo ${id}, featured: ${featured} (type: ${typeof featured})`);
    
    // Convert boolean to integer explicitly for database consistency
    const featuredValue = featured === true ? 1 : 0;
    
    console.log(`🌟 Converting featured value: ${featured} => ${featuredValue}`);
    
    // Get current photo status before update
    const currentPhoto = await db.get('SELECT * FROM photos WHERE id = ?', [id]);
    if (currentPhoto) {
      console.log(`🌟 Current photo featured status: ${currentPhoto.featured} (type: ${typeof currentPhoto.featured})`);
    }
    
    // Update photo featured status
    const result = await db.run(
      'UPDATE photos SET featured = ? WHERE id = ?',
      [featuredValue, id]
    );
    
    console.log(`🌟 Database update result: ${result.changes} rows affected`);
    
    if (result.changes === 0) {
      console.log(`🌟 Photo ${id} not found in database`);
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    // Verify the update
    const updatedPhoto = await db.get('SELECT * FROM photos WHERE id = ?', [id]);
    console.log(`🌟 Photo ${id} featured status updated from ${currentPhoto?.featured} to ${updatedPhoto?.featured}`);
    
    res.json({ success: true, message: `Photo ${featured ? 'added to' : 'removed from'} featured work` });
  } catch (error) {
    console.error('Toggle featured photo error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update about photo for admin
app.put('/api/admin/about-photo', requireAuth, async (req, res) => {
  try {
    const { aboutPhotoData } = req.body;
    
    // Check if user is admin
    const user = await db.get('SELECT * FROM users WHERE id = ?', [req.session.userId]);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    // Handle about photo removal
    if (aboutPhotoData === null) {
      // Update user about photo to null in database
      const result = await db.run(
        'UPDATE users SET about_photo = ?, updated_at = ? WHERE id = ?',
        [null, new Date().toISOString(), req.session.userId]
      );
      
      if (result.changes === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      return res.json({ 
        success: true, 
        message: 'About photo removed successfully',
        aboutPhotoUrl: null
      });
    }
    
    if (!aboutPhotoData) {
      return res.status(400).json({ error: 'About photo data is required' });
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const filename = `about-${req.session.userId}-${timestamp}-${randomId}.jpg`;
    const key = `about-photos/${filename}`;
    
    // Convert base64 to buffer
    const base64Data = aboutPhotoData.replace(/^data:image\/[a-z]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Upload to DigitalOcean Spaces
    const uploadParams = {
      Bucket: process.env.SPACES_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: 'image/jpeg',
      ACL: 'public-read'
    };
    
    await s3Client.upload(uploadParams).promise();
    
    // Generate the public URL
    const aboutPhotoUrl = `https://${process.env.SPACES_BUCKET}.${process.env.SPACES_ENDPOINT}/${key}`;
    
    // Update user about photo URL in database
    const result = await db.run(
      'UPDATE users SET about_photo = ?, updated_at = ? WHERE id = ?',
      [aboutPhotoUrl, new Date().toISOString(), req.session.userId]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ 
      success: true, 
      message: 'About photo updated successfully',
      aboutPhotoUrl: aboutPhotoUrl
    });
  } catch (error) {
    console.error('Update about photo error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get about photo for public display
app.get('/api/about-photo', async (req, res) => {
  try {
    const admin = await db.get(`
      SELECT about_photo, name 
      FROM users 
      WHERE role = 'admin' 
      ORDER BY created_at ASC 
      LIMIT 1
    `);
    
    res.json({ 
      aboutPhotoUrl: admin?.about_photo || null,
      adminName: admin?.name || 'Alina'
    });
  } catch (error) {
    console.error('Get about photo error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get featured photos for home page
app.get('/api/featured-photos', async (req, res) => {
  try {
    console.log('🌟 Featured photos API called');
    
    // Get all photos first
    const allPhotos = await db.all('SELECT * FROM photos');
    console.log('🌟 Total photos in database:', allPhotos.length);
    
    // Log featured status of each photo
    allPhotos.forEach(photo => {
      console.log(`🌟 Photo ${photo.id}: featured = ${photo.featured} (type: ${typeof photo.featured})`);
    });
    
    // Filter for featured photos in JavaScript since database abstraction may have issues
    const photosData = await db.all(`
      SELECT p.*, s.title as shoot_title, c.name as shoot_category
      FROM photos p
      JOIN shoots s ON p.shoot_id = s.id
      LEFT JOIN categories c ON s.category_id = c.id
    `);
    
    // Filter for featured photos (handle both boolean, integer, and null values)
    const photos = photosData.filter(photo => {
      // Only return photos where featured is explicitly true/1/'1', not null/undefined/false
      const isFeatured = photo.featured === true || photo.featured === 1 || photo.featured === '1';
      console.log(`🌟 Photo ${photo.id} featured check: ${photo.featured} (type: ${typeof photo.featured}) => ${isFeatured}`);
      return isFeatured;
    });
    
    console.log('🌟 Found', photos.length, 'featured photos after filtering');
    
    // Add camelCase versions for frontend compatibility
    const formattedPhotos = photos.map(photo => ({
      id: photo.id,
      original_name: photo.original_name,
      filename: photo.filename,
      display_url: photo.display_url,
      download_url: photo.download_url,
      display_key: photo.display_key,
      download_key: photo.download_key,
      original_size: photo.original_size,
      compressed_size: photo.compressed_size,
      has_high_res: photo.has_high_res,
      uploaded_at: photo.uploaded_at,
      featured: photo.featured,
      shoot_title: photo.shoot_title,
      shoot_category: photo.shoot_category,
      // Add camelCase versions for frontend compatibility
      displayUrl: photo.display_url,
      downloadUrl: photo.download_url,
      displayKey: photo.display_key,
      downloadKey: photo.download_key,
      originalSize: photo.original_size,
      compressedSize: photo.compressed_size,
      hasHighRes: photo.has_high_res,
      uploadedAt: photo.uploaded_at,
      shootTitle: photo.shoot_title,
      shootCategory: photo.shoot_category
    }));
    
    console.log('🌟 Returning', formattedPhotos.length, 'formatted photos');
    res.json({ photos: formattedPhotos });
  } catch (error) {
    console.error('Get featured photos error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete account
app.delete('/api/profile/delete-account', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    // Prevent deleting admin user
    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (user && user.role === 'admin') {
      return res.status(403).json({ error: 'Admin accounts cannot be deleted through this method' });
    }
    
    // Delete user
    const result = await db.run('DELETE FROM users WHERE id = ?', [userId]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Clear session
    req.session.destroy();
    
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===================================
// Serve React Frontend in Production
// ===================================
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React app build directory
  app.use(express.static(path.join(__dirname, '../dist')));

  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
  });
}

// ===================================
// Admin Recovery Routes
// ===================================

// Emergency admin recovery endpoint (only works if no admin exists)
app.post('/api/admin/recover', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Check if any admin users exist
    const adminCount = await db.get('SELECT COUNT(*) as count FROM users WHERE role = ?', ['admin']);
    
    if (adminCount.count > 0) {
      return res.status(403).json({ 
        error: 'Admin recovery not available - admin users already exist',
        message: 'This endpoint is only available when no admin users exist'
      });
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if user exists
    const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    
    if (existingUser) {
      // Update existing user to admin
      await db.run(
        'UPDATE users SET password_hash = ?, role = ?, status = ?, updated_at = ? WHERE email = ?',
        [hashedPassword, 'admin', 'approved', new Date().toISOString(), email]
      );
      
      console.log(`🔧 Admin recovery: Promoted existing user ${email} to admin`);
    } else {
      // Create new admin user
      await db.run(
        `INSERT INTO users (email, password_hash, role, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [email, hashedPassword, 'admin', 'approved', new Date().toISOString(), new Date().toISOString()]
      );
      
      console.log(`🔧 Admin recovery: Created new admin user ${email}`);
    }
    
    res.json({ 
      success: true, 
      message: 'Admin account created/updated successfully',
      email: email
    });
  } catch (error) {
    console.error('Admin recovery error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===================================
// Contact Form Email
// ===================================

// Send contact form email
app.post('/api/contact/send', async (req, res) => {
  try {
    const { name, email, phone, sessionType, date, message } = req.body;
    
    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }
    
    // Check if email configuration exists
    if (!transporter) {
      console.log('⚠️  Email not configured - skipping send');
      // In development, just log the email
      console.log('📧 Contact Form Submission:');
      console.log(`   From: ${name} <${email}>`);
      console.log(`   Phone: ${phone || 'N/A'}`);
      console.log(`   Session Type: ${sessionType || 'N/A'}`);
      console.log(`   Date: ${date || 'N/A'}`);
      console.log(`   Message: ${message}`);
      
      return res.json({ 
        success: true, 
        message: 'Thank you! Your message has been received.' 
      });
    }
    
    // Email content
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6B46C1;">New Contact Form Submission</h2>
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-top: 20px;">
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
          <p><strong>Session Type:</strong> ${sessionType || 'Not specified'}</p>
          ${date ? `<p><strong>Preferred Date:</strong> ${date}</p>` : ''}
        </div>
        <div style="margin-top: 20px; padding: 20px; background-color: #fff; border-left: 4px solid #6B46C1;">
          <h3 style="color: #6B46C1; margin-top: 0;">Message:</h3>
          <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
        </div>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #888; font-size: 0.9em;">
          <p>This email was sent from the Skylit Photography contact form.</p>
        </div>
      </div>
    `;
    
    // Send email
    const mailOptions = {
      from: `"${name}" <${emailUser}>`,
      to: adminEmail || emailUser,
      replyTo: email,
      subject: `New Contact: ${sessionType || 'General Inquiry'} - ${name}`,
      html: emailHtml,
      text: `
New Contact Form Submission

Name: ${name}
Email: ${email}
Phone: ${phone || 'Not provided'}
Session Type: ${sessionType || 'Not specified'}
Preferred Date: ${date || 'Not specified'}

Message:
${message}

---
This email was sent from the Skylit Photography contact form.
      `.trim()
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`✅ Contact email sent from ${name} (${email})`);
    
    res.json({ 
      success: true, 
      message: 'Thank you! Your message has been sent successfully.' 
    });
    
  } catch (error) {
    console.error('Contact email error:', error);
    res.status(500).json({ error: 'Failed to send message. Please try again later.' });
  }
});

// ===================================
// Start Server
// ===================================

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database
    await db.init();
    
    // Check if we need to migrate existing JSON data (DISABLED FOR PRODUCTION)
    // const existingData = await checkForExistingData();
    
    // if (existingData) {
    //   console.log('🔄 Found existing JSON data - running migration...');
    //   const { migrateToSQLite } = require('./migrate-to-sqlite');
    //   
    //   // Run migrations
    //   await migrateToSQLite.migrateUsers();
    //   await migrateToSQLite.migrateShoots();
    //   await migrateToSQLite.migrateBookings();
    //   await migrateToSQLite.migrateInvoices();
    //   await migrateToSQLite.migrateExpenses();
    //   await migrateToSQLite.migratePricing();
    //   
    //   console.log('✅ Migration completed');
    // } else {
      // Only create default admin if NO users exist at all (not just no admin users)
      const userCount = await db.get('SELECT COUNT(*) as count FROM users');
      if (userCount.count === 0) {
        console.log('⚠️  No users found - creating default admin account');
        
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@skylit.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        
        await db.run(
          `INSERT INTO users (email, password_hash, role, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            adminEmail,
            hashedPassword,
            'admin',
            'approved',
            new Date().toISOString(),
            new Date().toISOString()
          ]
        );
        
        console.log('✅ Default admin account created');
        console.log(`📧 Email: ${adminEmail}`);
        console.log(`🔑 Password: ${adminPassword}`);
        console.log('⚠️  Please change this password after first login!');
      } else {
        console.log(`✅ Found ${userCount.count} existing users in database`);
        
        // Check if there are any admin users
        const adminCount = await db.get('SELECT COUNT(*) as count FROM users WHERE role = ?', ['admin']);
        if (adminCount.count === 0) {
          console.log('⚠️  WARNING: No admin users found in database');
          console.log('   You may need to promote a user to admin or create a new admin account');
        } else {
          console.log(`✅ Found ${adminCount.count} admin user(s)`);
        }
      }
      
      // Initialize pricing categories
      const categoryCount = await db.get('SELECT COUNT(*) as count FROM pricing_categories');
      if (categoryCount.count === 0) {
        const defaultCategories = [
          "Weddings", "Engagements", "Portraits", "Family", "Newborn", 
          "Maternity", "Couples", "Cars", "Motorcycles", "Animals", 
          "Events", "Lifestyle", "Fashion", "Headshots", "Real Estate", 
          "Products", "Nature", "Other"
        ];
        
        for (const category of defaultCategories) {
          await db.run('INSERT INTO pricing_categories (name) VALUES (?)', [category]);
        }
        console.log('✅ Default pricing categories created');
      }
    // }
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`🗄️  Database: SQLite (${db.dbPath})`);
      console.log(`📸 Uploads stored in: ${path.join(__dirname, 'uploads')}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
    
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
}

// Check if there's existing JSON data to migrate
async function checkForExistingData() {
  try {
    await fs.access(USERS_FILE);
    return true;
  } catch (error) {
    try {
      await fs.access(SHOOTS_FILE);
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Start the server
startServer();

