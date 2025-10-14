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
    const usersData = await readJSONFile(USERS_FILE);
    const user = usersData.users.find(u => u.id === id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy (DISABLED - Can be enabled by setting environment variables)
const GOOGLE_OAUTH_ENABLED = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

if (GOOGLE_OAUTH_ENABLED) {
  console.log('✅ Google OAuth is ENABLED');
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const usersData = await readJSONFile(USERS_FILE);
      
      // Check if user already exists by Google ID
      let user = usersData.users.find(u => u.googleId === profile.id);
      
      if (!user) {
        // Check if user exists by email
        user = usersData.users.find(u => u.email === profile.emails[0].value);
        
        if (user) {
          // Link Google account to existing user
          user.googleId = profile.id;
          user.profilePicture = profile.photos[0]?.value;
          await writeJSONFile(USERS_FILE, usersData);
        } else {
          // Create new user with pending status
          const newUser = {
            id: Date.now().toString(),
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            profilePicture: profile.photos[0]?.value,
            phone: '', // Will need to be added later
            role: 'user',
            status: 'pending', // Requires admin approval
            createdAt: new Date().toISOString(),
            authMethod: 'google'
          };
          
          usersData.users.push(newUser);
          await writeJSONFile(USERS_FILE, usersData);
          user = newUser;
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
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PRICING_FILE = path.join(DATA_DIR, 'pricing.json');
const AUTH_SESSIONS_FILE = path.join(DATA_DIR, 'auth-sessions.json');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');
const SHOOTS_FILE = path.join(DATA_DIR, 'shoots.json');
const INVOICES_FILE = path.join(DATA_DIR, 'invoices.json');
const EXPENSES_FILE = path.join(DATA_DIR, 'expenses.json');

// Ensure data directory exists
async function ensureDataDirectory() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Read JSON file
async function readJSONFile(filePath, defaultData = {}) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist, create it with default data
    await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
}

// Write JSON file
async function writeJSONFile(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// Initialize data files
async function initializeDataFiles() {
  await ensureDataDirectory();
  
  // Initialize users file - only create default admin if file doesn't exist
  try {
    // Try to read existing users file
    await fs.access(USERS_FILE);
    console.log('✅ Users file exists - preserving existing data');
  } catch (error) {
    // File doesn't exist - create with default admin
    console.log('⚠️  Users file not found - creating default admin account');
    
    // Use environment variables for admin credentials if available
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@skylit.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    const defaultUsers = {
      users: [
        {
          id: 1,
          email: adminEmail,
          password: hashedPassword,
          name: 'Alina Suedbeck',
          role: 'admin',
          authMethod: 'email',
          createdAt: new Date().toISOString()
        }
      ]
    };
    await writeJSONFile(USERS_FILE, defaultUsers);
    console.log(`✅ Default admin created: ${adminEmail}`);
  }

  // Initialize pricing file
  const defaultPricing = {
    packages: [
      {
        id: 1,
        name: 'Essential',
        price: 350,
        duration: '1 hour',
        features: [
          '1 hour photo session',
          '1 location',
          '30 edited high-resolution images',
          'Online gallery',
          'Personal printing rights',
          '2 week delivery'
        ],
        recommended: false
      },
      {
        id: 2,
        name: 'Premium',
        price: 650,
        duration: '2 hours',
        features: [
          '2 hour photo session',
          'Up to 2 locations',
          '75 edited high-resolution images',
          'Online gallery',
          'Personal printing rights',
          'Expedited 1 week delivery',
          'Complimentary wardrobe consultation'
        ],
        recommended: true
      },
      {
        id: 3,
        name: 'Luxury',
        price: 1200,
        duration: 'Half day',
        features: [
          'Half day coverage (4 hours)',
          'Multiple locations',
          '150+ edited high-resolution images',
          'Premium online gallery',
          'Full printing rights',
          'Expedited 1 week delivery',
          'Pre-session consultation',
          'Complimentary engagement session'
        ],
        recommended: false
      }
    ],
    addOns: [
      { id: 1, name: 'Additional Hour', price: 200 },
      { id: 2, name: 'Rush Delivery (1 week)', price: 150 },
      { id: 3, name: 'Second Photographer', price: 300 },
      { id: 4, name: 'Printed Photo Album', price: 400 },
      { id: 5, name: 'Canvas Print (16x20)', price: 150 },
      { id: 6, name: 'USB with All Photos', price: 75 }
    ]
  };
  await readJSONFile(PRICING_FILE, defaultPricing);

  // Initialize auth sessions file
  await readJSONFile(AUTH_SESSIONS_FILE, { sessions: [] });

  // Initialize bookings/sessions file
  const defaultBookings = {
    bookings: []
  };
  await readJSONFile(BOOKINGS_FILE, defaultBookings);

  // Initialize invoices file
  const defaultInvoices = {
    invoices: []
  };
  await readJSONFile(INVOICES_FILE, defaultInvoices);

  // Initialize expenses file
  const defaultExpenses = {
    expenses: []
  };
  await readJSONFile(EXPENSES_FILE, defaultExpenses);

  // Initialize shoots file
  const defaultShoots = {
    categories: [
      'Weddings',
      'Engagements', 
      'Portraits',
      'Family',
      'Newborn',
      'Maternity',
      'Couples',
      'Cars',
      'Motorcycles',
      'Animals',
      'Events',
      'Lifestyle',
      'Fashion',
      'Headshots',
      'Real Estate',
      'Products',
      'Nature',
      'Other'
    ],
    shoots: []
  };
  await readJSONFile(SHOOTS_FILE, defaultShoots);
}

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
        
        // Save session to file
        const sessionsData = await readJSONFile(AUTH_SESSIONS_FILE, { sessions: [] });
        sessionsData.sessions.push({
          sessionId: req.sessionID,
          userId: req.user.id,
          createdAt: new Date().toISOString()
        });
        await writeJSONFile(AUTH_SESSIONS_FILE, sessionsData);
        
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

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user with pending approval status
    const result = await db.run(
      `INSERT INTO users (email, password_hash, role, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        email,
        hashedPassword,
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
      
      // Save session to file for tracking
      readJSONFile(AUTH_SESSIONS_FILE, { sessions: [] })
        .then(sessionsData => {
          sessionsData.sessions.push({
            sessionId: req.sessionID,
            userId: user.id,
            createdAt: new Date().toISOString()
          });
          return writeJSONFile(AUTH_SESSIONS_FILE, sessionsData);
        })
        .catch(err => console.error('Auth sessions file error:', err));

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
    // Remove session from file
    const sessionsData = await readJSONFile(AUTH_SESSIONS_FILE, { sessions: [] });
    sessionsData.sessions = sessionsData.sessions.filter(s => s.sessionId !== req.sessionID);
    await writeJSONFile(AUTH_SESSIONS_FILE, sessionsData);

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

    const usersData = await readJSONFile(USERS_FILE);
    const user = usersData.users.find(u => u.id === req.session.userId);

    if (!user) {
      return res.status(401).json({ authenticated: false });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({
      authenticated: true,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Session check error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===================================
// Pricing Routes
// ===================================

// Get all pricing data
app.get('/api/pricing', async (req, res) => {
  try {
    const pricingData = await readJSONFile(PRICING_FILE);
    res.json(pricingData);
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
    const updatedPackage = req.body;

    const pricingData = await readJSONFile(PRICING_FILE);
    const packageIndex = pricingData.packages.findIndex(p => p.id === packageId);

    if (packageIndex === -1) {
      return res.status(404).json({ error: 'Package not found' });
    }

    pricingData.packages[packageIndex] = { ...pricingData.packages[packageIndex], ...updatedPackage };
    await writeJSONFile(PRICING_FILE, pricingData);

    res.json({ success: true, package: pricingData.packages[packageIndex] });
  } catch (error) {
    console.error('Update package error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add package (admin only)
app.post('/api/pricing/packages', requireAdmin, async (req, res) => {
  try {
    const newPackage = req.body;
    const pricingData = await readJSONFile(PRICING_FILE);

    // Generate new ID
    const maxId = Math.max(...pricingData.packages.map(p => p.id), 0);
    newPackage.id = maxId + 1;

    pricingData.packages.push(newPackage);
    await writeJSONFile(PRICING_FILE, pricingData);

    res.json({ success: true, package: newPackage });
  } catch (error) {
    console.error('Add package error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete package (admin only)
app.delete('/api/pricing/packages/:id', requireAdmin, async (req, res) => {
  try {
    const packageId = parseInt(req.params.id);
    const pricingData = await readJSONFile(PRICING_FILE);

    pricingData.packages = pricingData.packages.filter(p => p.id !== packageId);
    await writeJSONFile(PRICING_FILE, pricingData);

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
    const updatedAddon = req.body;

    const pricingData = await readJSONFile(PRICING_FILE);
    const addonIndex = pricingData.addOns.findIndex(a => a.id === addonId);

    if (addonIndex === -1) {
      return res.status(404).json({ error: 'Add-on not found' });
    }

    pricingData.addOns[addonIndex] = { ...pricingData.addOns[addonIndex], ...updatedAddon };
    await writeJSONFile(PRICING_FILE, pricingData);

    res.json({ success: true, addon: pricingData.addOns[addonIndex] });
  } catch (error) {
    console.error('Update add-on error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add add-on (admin only)
app.post('/api/pricing/addons', requireAdmin, async (req, res) => {
  try {
    const newAddon = req.body;
    const pricingData = await readJSONFile(PRICING_FILE);

    // Generate new ID
    const maxId = Math.max(...pricingData.addOns.map(a => a.id), 0);
    newAddon.id = maxId + 1;

    pricingData.addOns.push(newAddon);
    await writeJSONFile(PRICING_FILE, pricingData);

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
    const pricingData = await readJSONFile(PRICING_FILE);

    pricingData.addOns = pricingData.addOns.filter(a => a.id !== addonId);
    await writeJSONFile(PRICING_FILE, pricingData);

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

    const bookingsData = await readJSONFile(BOOKINGS_FILE);
    
    // Admin sees all bookings, users see only their own
    const bookings = req.session.userRole === 'admin'
      ? bookingsData.bookings
      : bookingsData.bookings.filter(b => b.userId === req.session.userId);
    
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
    const bookingsData = await readJSONFile(BOOKINGS_FILE);
    
    const booking = bookingsData.bookings.find(b => b.id === bookingId);
    
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

    const { sessionType, date, time, location, notes, clientName, clientEmail } = req.body;
    
    if (!sessionType || !date) {
      return res.status(400).json({ error: 'Session type and date required' });
    }

    const bookingsData = await readJSONFile(BOOKINGS_FILE);
    const usersData = await readJSONFile(USERS_FILE);
    
    // Get user info
    const user = usersData.users.find(u => u.id === req.session.userId);
    
    // Generate new ID
    const maxId = Math.max(...bookingsData.bookings.map(b => b.id), 0);
    const newBooking = {
      id: maxId + 1,
      userId: req.session.userId,
      clientName: clientName || user.name,
      clientEmail: clientEmail || user.email,
      sessionType,
      date,
      time: time || '',
      location: location || '',
      notes: notes || '',
      status: 'Pending',
      createdAt: new Date().toISOString(),
      invoiceId: null
    };
    
    bookingsData.bookings.unshift(newBooking);
    await writeJSONFile(BOOKINGS_FILE, bookingsData);
    
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
    
    const bookingsData = await readJSONFile(BOOKINGS_FILE);
    const bookingIndex = bookingsData.bookings.findIndex(b => b.id === bookingId);
    
    if (bookingIndex === -1) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    bookingsData.bookings[bookingIndex] = {
      ...bookingsData.bookings[bookingIndex],
      ...updates,
      id: bookingId
    };
    
    await writeJSONFile(BOOKINGS_FILE, bookingsData);
    
    res.json({ success: true, booking: bookingsData.bookings[bookingIndex] });
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
    
    const bookingsData = await readJSONFile(BOOKINGS_FILE);
    const bookingIndex = bookingsData.bookings.findIndex(b => b.id === bookingId);
    
    if (bookingIndex === -1) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    bookingsData.bookings[bookingIndex].status = status;
    
    await writeJSONFile(BOOKINGS_FILE, bookingsData);
    
    res.json({ success: true, booking: bookingsData.bookings[bookingIndex] });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete booking (admin only)
app.delete('/api/bookings/:id', requireAdmin, async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const bookingsData = await readJSONFile(BOOKINGS_FILE);
    
    bookingsData.bookings = bookingsData.bookings.filter(b => b.id !== bookingId);
    await writeJSONFile(BOOKINGS_FILE, bookingsData);
    
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
    const invoicesData = await readJSONFile(INVOICES_FILE);
    res.json({ invoices: invoicesData.invoices });
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
    
    const invoicesData = await readJSONFile(INVOICES_FILE);
    
    // Generate invoice number
    const maxId = Math.max(...invoicesData.invoices.map(i => i.id), 0);
    const invoiceNumber = `INV-${String(maxId + 1).padStart(4, '0')}`;
    
    const newInvoice = {
      id: maxId + 1,
      invoiceNumber,
      clientName,
      clientEmail: clientEmail || '',
      amount: parseFloat(amount),
      status: status || 'Pending',
      date: date || new Date().toISOString().split('T')[0],
      items: items || [],
      bookingId: bookingId || null,
      createdAt: new Date().toISOString()
    };
    
    invoicesData.invoices.unshift(newInvoice);
    await writeJSONFile(INVOICES_FILE, invoicesData);
    
    // If linked to booking, update booking with invoice ID
    if (bookingId) {
      const bookingsData = await readJSONFile(BOOKINGS_FILE);
      const bookingIndex = bookingsData.bookings.findIndex(b => b.id === bookingId);
      if (bookingIndex !== -1) {
        bookingsData.bookings[bookingIndex].invoiceId = newInvoice.id;
        bookingsData.bookings[bookingIndex].status = 'Invoiced';
        await writeJSONFile(BOOKINGS_FILE, bookingsData);
      }
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
    
    const invoicesData = await readJSONFile(INVOICES_FILE);
    const invoiceIndex = invoicesData.invoices.findIndex(i => i.id === invoiceId);
    
    if (invoiceIndex === -1) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    invoicesData.invoices[invoiceIndex] = {
      ...invoicesData.invoices[invoiceIndex],
      ...updates,
      id: invoiceId
    };
    
    await writeJSONFile(INVOICES_FILE, invoicesData);
    
    res.json({ success: true, invoice: invoicesData.invoices[invoiceIndex] });
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete invoice (admin only)
app.delete('/api/invoices/:id', requireAdmin, async (req, res) => {
  try {
    const invoiceId = parseInt(req.params.id);
    const invoicesData = await readJSONFile(INVOICES_FILE);
    
    invoicesData.invoices = invoicesData.invoices.filter(i => i.id !== invoiceId);
    await writeJSONFile(INVOICES_FILE, invoicesData);
    
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
    const expensesData = await readJSONFile(EXPENSES_FILE);
    res.json({ expenses: expensesData.expenses });
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
    
    const expensesData = await readJSONFile(EXPENSES_FILE);
    
    const maxId = Math.max(...expensesData.expenses.map(e => e.id), 0);
    const newExpense = {
      id: maxId + 1,
      category,
      description,
      amount: parseFloat(amount),
      date: date || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };
    
    expensesData.expenses.unshift(newExpense);
    await writeJSONFile(EXPENSES_FILE, expensesData);
    
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
    
    const expensesData = await readJSONFile(EXPENSES_FILE);
    const expenseIndex = expensesData.expenses.findIndex(e => e.id === expenseId);
    
    if (expenseIndex === -1) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    expensesData.expenses[expenseIndex] = {
      ...expensesData.expenses[expenseIndex],
      ...updates,
      id: expenseId
    };
    
    await writeJSONFile(EXPENSES_FILE, expensesData);
    
    res.json({ success: true, expense: expensesData.expenses[expenseIndex] });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete expense (admin only)
app.delete('/api/expenses/:id', requireAdmin, async (req, res) => {
  try {
    const expenseId = parseInt(req.params.id);
    const expensesData = await readJSONFile(EXPENSES_FILE);
    
    expensesData.expenses = expensesData.expenses.filter(e => e.id !== expenseId);
    await writeJSONFile(EXPENSES_FILE, expensesData);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===================================
// Portfolio/Shoots Routes
// ===================================

// Get all shoots and categories
app.get('/api/portfolio', async (req, res) => {
  try {
    // Get all shoots with their photos
    const shoots = await db.all(`
      SELECT s.*, 
             json_group_array(
               json_object(
                 'id', p.id,
                 'original_name', p.original_name,
                 'filename', p.filename,
                 'display_url', p.display_url,
                 'download_url', p.download_url,
                 'display_key', p.display_key,
                 'download_key', p.download_key,
                 'original_size', p.original_size,
                 'compressed_size', p.compressed_size,
                 'has_high_res', p.has_high_res,
                 'uploaded_at', p.uploaded_at
               )
             ) as photos
      FROM shoots s
      LEFT JOIN photos p ON s.id = p.shoot_id
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `);

    // Get all categories
    const categories = await db.all('SELECT name FROM pricing_categories ORDER BY name');

    // Process shoots to parse JSON fields
    const processedShoots = shoots.map(shoot => ({
      ...shoot,
      authorizedEmails: db.parseJSONField(shoot.authorized_emails) || [],
      downloadStats: db.parseJSONField(shoot.download_stats) || {},
      photos: db.parseJSONField(shoot.photos) || []
    }));

    res.json({
      shoots: processedShoots,
      categories: categories.map(c => c.name)
    });
  } catch (error) {
    console.error('Get portfolio error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get shoots by category
app.get('/api/portfolio/category/:category', async (req, res) => {
  try {
    const category = req.params.category;
    const shootsData = await readJSONFile(SHOOTS_FILE);
    
    const filteredShoots = category === 'all' 
      ? shootsData.shoots 
      : shootsData.shoots.filter(shoot => shoot.category.toLowerCase() === category.toLowerCase());
    
    res.json({ shoots: filteredShoots });
  } catch (error) {
    console.error('Get shoots by category error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single shoot
app.get('/api/portfolio/shoots/:id', async (req, res) => {
  try {
    const shootId = parseInt(req.params.id);
    const shootsData = await readJSONFile(SHOOTS_FILE);
    const shoot = shootsData.shoots.find(s => s.id === shootId);
    
    if (!shoot) {
      return res.status(404).json({ error: 'Shoot not found' });
    }
    
    res.json(shoot);
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
    
    const shootsData = await readJSONFile(SHOOTS_FILE);
    
    // Generate new ID
    const maxId = Math.max(...shootsData.shoots.map(s => s.id), 0);
    const newShoot = {
      id: maxId + 1,
      title,
      description: description || '',
      category,
      date: date || new Date().toISOString(),
      photos: [],
      createdAt: new Date().toISOString()
    };
    
    shootsData.shoots.unshift(newShoot);
    await writeJSONFile(SHOOTS_FILE, shootsData);
    
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
    const updates = req.body;
    
    const shootsData = await readJSONFile(SHOOTS_FILE);
    const shootIndex = shootsData.shoots.findIndex(s => s.id === shootId);
    
    if (shootIndex === -1) {
      return res.status(404).json({ error: 'Shoot not found' });
    }
    
    shootsData.shoots[shootIndex] = {
      ...shootsData.shoots[shootIndex],
      ...updates,
      id: shootId // Prevent ID from being changed
    };
    
    await writeJSONFile(SHOOTS_FILE, shootsData);
    
    res.json({ success: true, shoot: shootsData.shoots[shootIndex] });
  } catch (error) {
    console.error('Update shoot error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete shoot (admin only)
app.delete('/api/portfolio/shoots/:id', requireAdmin, async (req, res) => {
  try {
    const shootId = parseInt(req.params.id);
    const shootsData = await readJSONFile(SHOOTS_FILE);
    
    const shoot = shootsData.shoots.find(s => s.id === shootId);
    if (!shoot) {
      return res.status(404).json({ error: 'Shoot not found' });
    }
    
    // Delete associated photos from storage
    for (const photo of shoot.photos) {
      try {
        if (SPACES_ENABLED && s3Client) {
          // Delete from DigitalOcean Spaces
          const deleteParams = {
            Bucket: process.env.SPACES_BUCKET,
            Key: photo.key || photo.filename || path.basename(photo.url)
          };
          await s3Client.deleteObject(deleteParams).promise();
          console.log(`Deleted from Spaces: ${photo.key || photo.filename}`);
        } else {
          // Delete from local filesystem
          const photoPath = path.join(__dirname, 'uploads', path.basename(photo.url));
          await fs.unlink(photoPath);
          console.log(`Deleted from local storage: ${path.basename(photo.url)}`);
        }
      } catch (err) {
        console.error('Error deleting photo:', err);
        // Continue to next photo
      }
    }
    
    shootsData.shoots = shootsData.shoots.filter(s => s.id !== shootId);
    await writeJSONFile(SHOOTS_FILE, shootsData);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete shoot error:', error);
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
    const shootsData = await readJSONFile(SHOOTS_FILE);
    
    const shootIndex = shootsData.shoots.findIndex(s => s.id === shootId);
    if (shootIndex === -1) {
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
      
      newPhotos.push({
        id: Date.now() + Math.random(),
        displayUrl: displayUrl,      // Compressed version for web display
        downloadUrl: downloadUrl,     // Original for downloads
        displayKey: displayKey,       // S3 key for compressed
        downloadKey: downloadKey,     // S3 key for original
        originalName: file.originalname,
        originalSize: originalSize,
        compressedSize: compressedSize,
        uploadedAt: new Date().toISOString(),
        hasHighRes: true  // Track if high-res still exists
      });
    }
    
    shootsData.shoots[shootIndex].photos.push(...newPhotos);
    await writeJSONFile(SHOOTS_FILE, shootsData);
    
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
    const photoId = parseFloat(req.params.photoId);
    
    const shootsData = await readJSONFile(SHOOTS_FILE);
    const shootIndex = shootsData.shoots.findIndex(s => s.id === shootId);
    
    if (shootIndex === -1) {
      return res.status(404).json({ error: 'Shoot not found' });
    }
    
    const photo = shootsData.shoots[shootIndex].photos.find(p => p.id === photoId);
    if (photo) {
      // Delete BOTH versions from storage
      try {
        if (SPACES_ENABLED && s3Client) {
          // Delete compressed version
          if (photo.displayKey) {
            await s3Client.deleteObject({
              Bucket: process.env.SPACES_BUCKET,
              Key: photo.displayKey
            }).promise();
            console.log(`Deleted compressed: ${photo.displayKey}`);
          }
          
          // Delete original version (if exists)
          if (photo.downloadKey && photo.hasHighRes) {
            await s3Client.deleteObject({
              Bucket: process.env.SPACES_BUCKET,
              Key: photo.downloadKey
            }).promise();
            console.log(`Deleted original: ${photo.downloadKey}`);
          }
        } else {
          // Delete from local filesystem
          const photoPath = path.join(__dirname, 'uploads', photo.filename || path.basename(photo.displayUrl));
          await fs.unlink(photoPath);
          console.log(`Deleted from local storage`);
        }
      } catch (err) {
        console.error('Error deleting file:', err);
        // Continue anyway to remove from database
      }
      
      // Remove from shoot
      shootsData.shoots[shootIndex].photos = shootsData.shoots[shootIndex].photos.filter(p => p.id !== photoId);
      await writeJSONFile(SHOOTS_FILE, shootsData);
    }
    
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
    
    const shootsData = await readJSONFile(SHOOTS_FILE);
    const shootIndex = shootsData.shoots.findIndex(s => s.id === shootId);
    
    if (shootIndex === -1) {
      return res.status(404).json({ error: 'Shoot not found' });
    }
    
    // Initialize authorizedEmails array if doesn't exist
    if (!shootsData.shoots[shootIndex].authorizedEmails) {
      shootsData.shoots[shootIndex].authorizedEmails = [];
    }
    
    // Add new emails (avoid duplicates)
    const currentEmails = shootsData.shoots[shootIndex].authorizedEmails;
    const newEmails = emails.filter(email => !currentEmails.includes(email.toLowerCase()));
    shootsData.shoots[shootIndex].authorizedEmails.push(...newEmails.map(e => e.toLowerCase()));
    
    await writeJSONFile(SHOOTS_FILE, shootsData);
    
    res.json({ 
      success: true, 
      authorizedEmails: shootsData.shoots[shootIndex].authorizedEmails,
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
    
    const shootsData = await readJSONFile(SHOOTS_FILE);
    const shootIndex = shootsData.shoots.findIndex(s => s.id === shootId);
    
    if (shootIndex === -1) {
      return res.status(404).json({ error: 'Shoot not found' });
    }
    
    if (!shootsData.shoots[shootIndex].authorizedEmails) {
      shootsData.shoots[shootIndex].authorizedEmails = [];
    }
    
    shootsData.shoots[shootIndex].authorizedEmails = 
      shootsData.shoots[shootIndex].authorizedEmails.filter(email => email !== emailToRemove);
    
    await writeJSONFile(SHOOTS_FILE, shootsData);
    
    res.json({ 
      success: true, 
      authorizedEmails: shootsData.shoots[shootIndex].authorizedEmails
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
    const shootsData = await readJSONFile(SHOOTS_FILE);
    const shoot = shootsData.shoots.find(s => s.id === shootId);
    
    if (!shoot) {
      return res.status(404).json({ error: 'Shoot not found' });
    }
    
    res.json({ 
      authorizedEmails: shoot.authorizedEmails || [],
      shootTitle: shoot.title
    });
  } catch (error) {
    console.error('Get authorized emails error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Check if current user has access to shoot (any authenticated user)
app.get('/api/portfolio/shoots/:id/has-access', requireAuth, async (req, res) => {
  try {
    const shootId = parseInt(req.params.id);
    const shootsData = await readJSONFile(SHOOTS_FILE);
    const shoot = shootsData.shoots.find(s => s.id === shootId);
    
    if (!shoot) {
      return res.status(404).json({ error: 'Shoot not found' });
    }
    
    // Admin always has access
    if (req.session.userRole === 'admin') {
      return res.json({ hasAccess: true, isAdmin: true });
    }
    
    // Get user email
    const usersData = await readJSONFile(USERS_FILE);
    const user = usersData.users.find(u => u.id === req.session.userId);
    
    if (!user) {
      return res.json({ hasAccess: false });
    }
    
    // Check if user email is in authorized list
    const authorizedEmails = shoot.authorizedEmails || [];
    const hasAccess = authorizedEmails.includes(user.email.toLowerCase());
    
    res.json({ 
      hasAccess,
      hasHighRes: shoot.photos?.some(p => p.hasHighRes) || false
    });
  } catch (error) {
    console.error('Check access error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Download high-res photo (authenticated users with permission)
app.get('/api/photos/:photoId/download', requireAuth, async (req, res) => {
  try {
    const photoId = parseFloat(req.params.photoId);
    
    // Find the photo and its shoot
    const shootsData = await readJSONFile(SHOOTS_FILE);
    let targetShoot = null;
    let targetPhoto = null;
    
    for (const shoot of shootsData.shoots) {
      const photo = shoot.photos.find(p => p.id === photoId);
      if (photo) {
        targetShoot = shoot;
        targetPhoto = photo;
        break;
      }
    }
    
    if (!targetShoot || !targetPhoto) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    // Check if high-res exists
    if (!targetPhoto.hasHighRes) {
      return res.status(410).json({ 
        error: 'High-resolution version no longer available',
        deletedAt: targetShoot.highResDeletedAt
      });
    }
    
    // Check permissions
    const isAdmin = req.session.userRole === 'admin';
    
    if (!isAdmin) {
      // Get user email
      const usersData = await readJSONFile(USERS_FILE);
      const user = usersData.users.find(u => u.id === req.session.userId);
      
      if (!user) {
        return res.status(403).json({ error: 'User not found' });
      }
      
      // Check if user is authorized
      const authorizedEmails = targetShoot.authorizedEmails || [];
      if (!authorizedEmails.includes(user.email.toLowerCase())) {
        return res.status(403).json({ error: 'Not authorized to download this photo' });
      }
    }
    
    // Track download
    if (!targetShoot.downloadStats) {
      targetShoot.downloadStats = { totalDownloads: 0, downloadHistory: [] };
    }
    
    const usersData = await readJSONFile(USERS_FILE);
    const user = usersData.users.find(u => u.id === req.session.userId);
    
    targetShoot.downloadStats.totalDownloads++;
    targetShoot.downloadStats.downloadHistory.push({
      photoId: photoId,
      userEmail: user?.email || 'unknown',
      downloadedAt: new Date().toISOString()
    });
    
    // Keep only last 100 downloads
    if (targetShoot.downloadStats.downloadHistory.length > 100) {
      targetShoot.downloadStats.downloadHistory = 
        targetShoot.downloadStats.downloadHistory.slice(-100);
    }
    
    await writeJSONFile(SHOOTS_FILE, shootsData);
    
    console.log(`📥 Download: ${user?.email} downloaded photo ${photoId} from shoot "${targetShoot.title}"`);
    
    // Redirect to download URL
    res.redirect(targetPhoto.downloadUrl);
  } catch (error) {
    console.error('Download photo error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete high-res versions for a shoot (admin only)
app.delete('/api/portfolio/shoots/:id/originals', requireAdmin, async (req, res) => {
  try {
    const shootId = parseInt(req.params.id);
    const shootsData = await readJSONFile(SHOOTS_FILE);
    const shootIndex = shootsData.shoots.findIndex(s => s.id === shootId);
    
    if (shootIndex === -1) {
      return res.status(404).json({ error: 'Shoot not found' });
    }
    
    const shoot = shootsData.shoots[shootIndex];
    let deletedCount = 0;
    let freedSpace = 0;
    
    // Delete original files from Spaces
    if (SPACES_ENABLED && s3Client) {
      for (const photo of shoot.photos) {
        if (photo.hasHighRes && photo.downloadKey) {
          try {
            await s3Client.deleteObject({
              Bucket: process.env.SPACES_BUCKET,
              Key: photo.downloadKey
            }).promise();
            
            freedSpace += photo.originalSize || 0;
            deletedCount++;
            console.log(`🗑️  Deleted original: ${photo.downloadKey}`);
          } catch (err) {
            console.error(`Error deleting ${photo.downloadKey}:`, err);
          }
        }
      }
    }
    
    // Update all photos to mark high-res as deleted
    shoot.photos.forEach(photo => {
      photo.hasHighRes = false;
      photo.downloadUrl = null; // Clear download URL
    });
    
    // Record deletion
    shoot.highResDeletedAt = new Date().toISOString();
    
    await writeJSONFile(SHOOTS_FILE, shootsData);
    
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

// Get storage statistics (admin only)
app.get('/api/portfolio/storage-stats', requireAdmin, async (req, res) => {
  try {
    const shootsData = await readJSONFile(SHOOTS_FILE);
    
    let totalPhotos = 0;
    let totalOriginalSize = 0;
    let totalCompressedSize = 0;
    let photosWithHighRes = 0;
    let shootsWithHighRes = 0;
    
    shootsData.shoots.forEach(shoot => {
      const hasHighRes = shoot.photos?.some(p => p.hasHighRes) || false;
      if (hasHighRes) shootsWithHighRes++;
      
      shoot.photos?.forEach(photo => {
        totalPhotos++;
        totalOriginalSize += photo.originalSize || 0;
        totalCompressedSize += photo.compressedSize || 0;
        if (photo.hasHighRes) photosWithHighRes++;
      });
    });
    
    res.json({
      totalPhotos,
      totalShoots: shootsData.shoots.length,
      shootsWithHighRes,
      photosWithHighRes,
      totalOriginalSizeMB: (totalOriginalSize / 1024 / 1024).toFixed(2),
      totalCompressedSizeMB: (totalCompressedSize / 1024 / 1024).toFixed(2),
      totalStorageMB: ((totalOriginalSize + totalCompressedSize) / 1024 / 1024).toFixed(2),
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
    
    const shootsData = await readJSONFile(SHOOTS_FILE);
    
    if (!shootsData.categories.includes(category)) {
      shootsData.categories.push(category);
      shootsData.categories.sort();
      await writeJSONFile(SHOOTS_FILE, shootsData);
    }
    
    res.json({ success: true, categories: shootsData.categories });
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
    const usersData = await readJSONFile(USERS_FILE);
    // Return users without passwords
    const usersWithoutPasswords = usersData.users.map(({ password, ...user }) => user);
    res.json({ users: usersWithoutPasswords });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get pending users (admin only)
app.get('/api/users/pending', requireAdmin, async (req, res) => {
  try {
    const usersData = await readJSONFile(USERS_FILE);
    const pendingUsers = usersData.users
      .filter(u => u.status === 'pending')
      .map(({ password, ...user }) => user);
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
    const usersData = await readJSONFile(USERS_FILE);
    const userIndex = usersData.users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    usersData.users[userIndex].status = 'approved';
    usersData.users[userIndex].approvedAt = new Date().toISOString();
    await writeJSONFile(USERS_FILE, usersData);
    
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
    const usersData = await readJSONFile(USERS_FILE);
    const userIndex = usersData.users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    usersData.users[userIndex].status = 'rejected';
    usersData.users[userIndex].rejectedAt = new Date().toISOString();
    await writeJSONFile(USERS_FILE, usersData);
    
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
    const usersData = await readJSONFile(USERS_FILE);
    
    // Prevent deleting admin user
    const user = usersData.users.find(u => u.id === userId);
    if (user && user.role === 'admin') {
      return res.status(403).json({ error: 'Cannot delete admin user' });
    }
    
    usersData.users = usersData.users.filter(u => u.id !== userId);
    await writeJSONFile(USERS_FILE, usersData);
    
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
    
    const usersData = await readJSONFile(USERS_FILE);
    const user = usersData.users.find(u => u.id === req.session.userId);
    
    if (!user) {
      console.error('User not found in database. Session userId:', req.session.userId);
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('Profile retrieved successfully for user:', user.email);
    
    // Return user without password
    const { password, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
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
    
    const usersData = await readJSONFile(USERS_FILE);
    
    // Check if email is already taken by another user
    const existingUser = usersData.users.find(u => u.email === email && u.id !== req.session.userId);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    
    // Update user email
    const userIndex = usersData.users.findIndex(u => u.id === req.session.userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    usersData.users[userIndex].email = email;
    await writeJSONFile(USERS_FILE, usersData);
    
    res.json({ success: true, message: 'Email updated successfully' });
  } catch (error) {
    console.error('Update email error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update phone
app.put('/api/profile/update-phone', requireAuth, async (req, res) => {
  try {
    const { phone } = req.body;
    
    const usersData = await readJSONFile(USERS_FILE);
    const userIndex = usersData.users.findIndex(u => u.id === req.session.userId);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    usersData.users[userIndex].phone = phone || '';
    await writeJSONFile(USERS_FILE, usersData);
    
    res.json({ success: true, message: 'Phone number updated successfully' });
  } catch (error) {
    console.error('Update phone error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update password
app.put('/api/profile/update-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }
    
    const usersData = await readJSONFile(USERS_FILE);
    const userIndex = usersData.users.findIndex(u => u.id === req.session.userId);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = usersData.users[userIndex];
    
    // Check if user has a password (Google OAuth users might not)
    if (!user.password) {
      return res.status(400).json({ error: 'Cannot change password for Google-authenticated accounts' });
    }
    
    // Verify current password with bcrypt
    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Hash new password before storing
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    usersData.users[userIndex].password = hashedPassword;
    await writeJSONFile(USERS_FILE, usersData);
    
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete account
app.delete('/api/profile/delete-account', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const usersData = await readJSONFile(USERS_FILE);
    
    // Prevent deleting admin user
    const user = usersData.users.find(u => u.id === userId);
    if (user && user.role === 'admin') {
      return res.status(403).json({ error: 'Admin accounts cannot be deleted through this method' });
    }
    
    // Delete user
    usersData.users = usersData.users.filter(u => u.id !== userId);
    await writeJSONFile(USERS_FILE, usersData);
    
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
// Start Server
// ===================================

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database
    await db.init();
    
    // Check if we need to migrate existing JSON data
    const existingData = await checkForExistingData();
    
    if (existingData) {
      console.log('🔄 Found existing JSON data - running migration...');
      const { migrateToSQLite } = require('./migrate-to-sqlite');
      
      // Run migrations
      await migrateToSQLite.migrateUsers();
      await migrateToSQLite.migrateShoots();
      await migrateToSQLite.migrateBookings();
      await migrateToSQLite.migrateInvoices();
      await migrateToSQLite.migrateExpenses();
      await migrateToSQLite.migratePricing();
      
      console.log('✅ Migration completed');
    } else {
      // Create default admin if no users exist
      const adminCount = await db.get('SELECT COUNT(*) as count FROM users WHERE role = ?', ['admin']);
      if (adminCount.count === 0) {
        console.log('⚠️  No admin users found - creating default admin account');
        
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
    }
    
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

