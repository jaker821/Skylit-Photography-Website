# Skylit Photography Portfolio Website v2.0.1

Professional portfolio website for photographer Alina Suedbeck with **Supabase database integration** for complete data persistence across deployments.

## Features

### Public Pages
- **Home** - Landing page with hero section and featured work
- **Portfolio** - Gallery of photography work with category filtering
- **Pricing** - Session packages and pricing information
- **About** - Information about Alina Suedbeck
- **Contact** - Contact form and booking information

### User Features
- User authentication and login
- Book photography sessions
- View booking history
- User profile management
- Download high-resolution photos (with permission)

### Admin Dashboard
- Upload and manage portfolio photos
- Create photo shoots with categories
- Manage user permissions for photo downloads
- User approval system
- Session management
- Financial tracking and invoicing
- Expense tracking

## Tech Stack

- **Frontend:** React.js 18.2.0, React Router, Vite
- **Backend:** Node.js + Express
- **Database:** Supabase PostgreSQL (external, persistent across deployments)
- **Storage:** DigitalOcean Spaces (S3-compatible with CDN)
- **Authentication:** Session-based with bcrypt password hashing
- **File Uploads:** Multer + Sharp (image compression)
- **Styling:** CSS3 with dark/light mode support

## What's New in v2.0.1

### 🐛 **Bug Fixes:**
- **✅ Fixed Email Update Issue** - Resolved "user not found" error when updating admin email
- **✅ Database Query Fix** - Corrected SQL parsing logic for UPDATE operations
- **✅ Profile Management** - All user profile updates now work correctly

## What's New in v2.0.0

### 🎉 **Major Updates:**
- **✅ Supabase Integration** - External PostgreSQL database for complete data persistence
- **✅ Zero Data Loss** - All data survives deployments automatically
- **✅ Professional Database** - Production-ready PostgreSQL with automatic backups
- **✅ Simplified Deployments** - Code-only updates, database never touched
- **✅ Enhanced Reliability** - 99.9% uptime with Supabase infrastructure

### 🔒 **Data Persistence Guarantees:**
- **Admin Credentials** - Persist through all deployments
- **User Data** - Profiles, bookings, and preferences saved
- **Photo Metadata** - Shoot information and permissions preserved
- **Business Data** - Invoices, expenses, and pricing maintained
- **Photo Files** - Stored in DigitalOcean Spaces with CDN

## Key Features

- **🔄 Complete Data Persistence** - Zero data loss during deployments
- **📸 Dual Photo Storage** - Compressed for web, originals for download
- **🔐 Secure Authentication** - Session-based with bcrypt hashing
- **👥 User Management** - Role-based permissions and approval system
- **📊 Business Tools** - Invoicing, expense tracking, and financial reports
- **🎨 Portfolio Management** - Organized photo shoots with categories
- **📱 Responsive Design** - Works perfectly on all devices
- **⚡ Performance** - CDN-accelerated photo delivery

## Supabase Database Setup

This app uses Supabase PostgreSQL for all data storage, ensuring persistence across deployments.

### Quick Setup

1. **Create Supabase Account:**
   - Go to [supabase.com](https://supabase.com)
   - Sign up with GitHub
   - Create new project: `skylit-photography`

2. **Get Database Credentials:**
   - Go to Settings → Database
   - Copy connection details (Host, Password, etc.)

3. **Configure Environment:**
   ```bash
   # Windows
   setup-supabase.bat
   
   # Linux/Mac
   chmod +x setup-supabase.sh
   ./setup-supabase.sh
   ```

4. **Update .env file** with your Supabase credentials

5. **Start the application:**
   ```bash
   npm run server
   ```

### What's Stored Where

- **Supabase Database:** Users, shoots, packages, bookings, invoices, expenses
- **DigitalOcean Spaces:** Photo files (compressed + original)
- **Database Links:** Photo metadata with Spaces URLs

## Getting Started

1. **Install dependencies:**
```bash
npm install
```

2. **Run development server:**
```bash
npm run dev:all
```

3. **Build for production:**
```bash
npm run build
```

## Environment Variables

Required for Supabase and DigitalOcean Spaces:

### Supabase Database
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `DB_HOST` - Your Supabase host (e.g., db.xxx.supabase.co)
- `DB_USER` - postgres
- `DB_PASSWORD` - Your Supabase database password
- `DB_NAME` - postgres
- `DB_PORT` - 5432

### DigitalOcean Spaces
- `SPACES_ENDPOINT` - Your Spaces endpoint
- `SPACES_REGION` - Your Spaces region
- `SPACES_BUCKET` - Your Spaces bucket name
- `SPACES_ACCESS_KEY` - Your Spaces access key
- `SPACES_SECRET_KEY` - Your Spaces secret key
- `SPACES_CDN_URL` - Your Spaces CDN URL

## Default Admin Login

- **Email:** admin@skylit.com
- **Password:** admin123

## Deployment

Deployed on DigitalOcean App Platform with automatic GitHub integration and Supabase database.

### Simple Deployment Process:
```bash
# Push to GitHub (DigitalOcean auto-deploys)
git add .
git commit -m "Update message"
git push origin main
```

### What DigitalOcean Does Automatically:
- ✅ **Pulls latest code** from GitHub
- ✅ **Installs dependencies** (`npm install`)
- ✅ **Builds frontend** (`npm run build`)
- ✅ **Restarts application** seamlessly
- ✅ **Database persists** through all deployments

### Migration from v1.x:
If upgrading from a previous version:
1. **Backup existing data** (if any)
2. **Set up Supabase database** (follow setup guide above)
3. **Update environment variables**
4. **Deploy new version**
5. **Re-upload photos** through admin panel (if needed)

## Changelog

### v2.0.1 (Current) - Bug Fixes
- **🐛 FIXED:** Email update functionality for admin users
- **🔧 IMPROVED:** SQL parsing logic for UPDATE operations
- **✅ STABILITY:** All profile management features now working correctly

### v2.0.0 - Supabase Integration
- **🎉 MAJOR:** Integrated Supabase PostgreSQL database
- **🔒 SECURITY:** Complete data persistence across deployments
- **⚡ PERFORMANCE:** Professional database infrastructure
- **🛠️ RELIABILITY:** 99.9% uptime with automatic backups
- **📦 DEPLOYMENT:** Simplified code-only deployments
- **🗑️ CLEANUP:** Removed SQLite dependencies and old database files

### v1.2.0 - Previous Version
- SQLite database with local file storage
- Basic photo upload and management
- User authentication and admin dashboard

## Contact

- **Email:** skylit.photography25@gmail.com
- **Location:** Raleigh/Durham, NC
- **Website:** [Live Site](https://skylit-website-86r3u.ondigitalocean.app)

## License

MIT