# Skylit Photography Portfolio Website v2.2.1

Professional portfolio website for photographer Alina Suedbeck with **Supabase database integration** for complete data persistence across deployments.

## Features

### Public Pages
- **Home** - Landing page with hero section and **auto-scrolling featured work gallery**
- **Portfolio** - Gallery of photography work with category filtering
- **Pricing** - Session packages and pricing information
- **About** - Information about Alina Suedbeck with **admin-editable professional photo**
- **Contact** - Contact form and booking information

### User Features
- User authentication and login
- Book photography sessions
- View booking history
- **Enhanced profile management** with tabbed interface
- **Profile picture upload** with cropping and DigitalOcean Spaces storage
- **Display name editing** for personalized experience
- Download high-resolution photos (with permission)

### Admin Dashboard
- Upload and manage portfolio photos
- **Featured work selection** - star photos to showcase on home page
- Create photo shoots with categories
- Manage user permissions for photo downloads
- User approval system
- **Enhanced session management** - Filterable and sortable session table with package/addon tracking
- **Email template system** - Pre-filled client communication templates for bookings
- **Interactive calendar** - Clickable calendar with day view showing session details
- Financial tracking and invoicing with accurate revenue calculations
- Expense tracking
- **Inline photo editing** - click photos to update directly on pages
- **PDF export** - Print session details with line items and customer information
- **Discount code management** - Create and manage coupon codes with usage tracking
- **Bulk email system** - Send promotional emails, announcements, and special offers to users
- **Invoice PDF email** - Send professional invoices as PDFs directly to clients
- **Package selection in invoices** - Select packages from dropdown in invoice items

## Tech Stack

- **Frontend:** React.js 18.2.0, React Router, Vite
- **Backend:** Node.js + Express
- **Database:** Supabase PostgreSQL (external, persistent across deployments)
- **Storage:** DigitalOcean Spaces (S3-compatible with CDN)
- **Authentication:** Session-based with bcrypt password hashing
- **File Uploads:** Multer + Sharp (image compression)
- **Image Processing:** react-image-crop for client-side cropping
- **Styling:** CSS3 with dark/light mode support

## What's New in v2.2.1

### 🎨 **New Features:**
- **📧 Invoice PDF Email** - Send professional HTML invoices as PDFs directly to clients via email
- **📦 Package Selection in Invoices** - Select packages from dropdown in invoice items, auto-fills description and price
- **👤 Auto-Populate Client Info** - Selecting a user account automatically fills client name and email fields
- **💰 Auto-Calculate Totals** - Invoice totals automatically calculate from line items in real-time
- **🎯 Improved Invoice Form UX** - "Link to User Account" moved to top with helpful instructions

### 🔧 **Improvements:**
- **📄 Professional Invoice Design** - Beautiful HTML invoice template with proper formatting and styling
- **🔄 Real-Time Calculations** - Invoice totals update automatically when items are added, removed, or modified
- **📋 Flexible Item Entry** - Choose from packages or enter custom descriptions for invoice items
- **🎨 Enhanced Form Layout** - Better organization with user account linking at the top

## What's New in v2.2.0

### 🎨 **New Features:**
- **🎟️ Discount Code System** - Complete discount/coupon code management with percentage or fixed amount discounts
- **💰 Package Price Autofill** - Selecting a package in quote/booking forms automatically fills the price
- **📧 Bulk Email System** - Send promotional emails, announcements, and special offers to all users or selected groups
- **🎯 Smart Discount Integration** - Discount codes can be applied to quotes, bookings, and session requests with automatic calculation
- **📊 Discount Code Management** - Full CRUD interface in Pricing tab with usage tracking, date validation, and limits

### 🔧 **Improvements:**
- **💵 Automatic Price Calculation** - Package selection now auto-fills quote amounts, reducing manual entry
- **🎨 Enhanced Form UX** - Real-time discount validation and total calculation display in quote/booking forms
- **📧 Email Templates** - Pre-built templates for deals, holidays, special pricing, seasonal offers, and announcements
- **👥 Flexible Recipient Selection** - Bulk emails can target all users, approved users only, or specific user groups
- **🎁 Discount Code Validation** - Real-time validation with minimum purchase amounts, usage limits, and expiration dates

### 🐛 **Bug Fixes:**
- **✅ Fixed Input Field Readability** - Improved text contrast in form inputs (dark text on light backgrounds)
- **✅ Fixed Browser Autofill Styling** - Override browser autofill dark backgrounds for better visibility

## What's New in v2.1.0

### 🎨 **Major System Overhaul:**
- **🔄 Unified Session System** - Complete consolidation of bookings and sessions into a single, comprehensive tracking system
- **📊 Complete Quote-to-Invoice Workflow** - Full lifecycle tracking from session request → quote → booking → paid → invoiced
- **💼 Professional Session Management** - New Sessions tab with status filtering (request, quoted, booked, paid, invoiced)
- **💰 Advanced Invoicing System** - Dedicated Invoicing tab with standalone and session-linked invoice management
- **📈 Financial Metrics Dashboard** - Real-time tracking of revenue, pending payments, and financial health
- **📧 Enhanced Email Integration** - ADHOC email system integrated with session management for seamless client communication

### 🔧 **Improvements:**
- **🎯 Streamlined Admin Dashboard** - Refactored tabs: Overview, Portfolio, Sessions, Invoicing, Expenses, Pricing, Users, Settings
- **📋 Status-Based Workflow** - Clear progression from request to invoice with actionable status transitions
- **🎨 Improved Readability** - Enhanced form styling with proper color contrast (dark text on light backgrounds)
- **🔄 Database Consolidation** - Single source of truth for all session data, eliminating duplication
- **⚡ Better Performance** - Optimized queries using Supabase client for complex joins and filtering

### 🐛 **Bug Fixes:**
- **✅ Fixed Migration Triggers** - Resolved duplicate trigger errors in database migrations
- **✅ Fixed Invoice Field Names** - Corrected session_id field references in standalone invoices
- **✅ Fixed Color Contrast** - Improved readability across all form modals and components

## What's New in v2.0.3

### 🎨 **New Features:**
- **📋 Enhanced Session Management** - Advanced filterable and sortable table with package/addon tracking
- **📧 Email Template System** - Pre-filled templates for client communication (booking confirmations, session reminders)
- **📅 Interactive Calendar** - Clickable calendar with day view showing detailed session information
- **💼 Package & Addon Integration** - Track packages and addons in booking forms and session details
- **📄 PDF Export Functionality** - Print session details with line items, totals, and customer information
- **🎨 Hero Animations** - New floating particles and aurora effects for stunning visual appeal
- **💰 Accurate Revenue Tracking** - Only invoiced sessions count toward revenue calculations

### 🔧 **Improvements:**
- **🔄 Session Detail Modals** - Clickable sessions open detailed modals for easy viewing and editing
- **📊 Improved Table Columns** - Better organization with package, price, and total columns
- **🎨 UI Enhancements** - Gold headers, improved color scheme, and better readability
- **🛡️ Photo Protection** - Enhanced security for portfolio photos
- **📱 Mobile Responsive** - All new features work perfectly on mobile devices

## What's New in v2.0.2

### 🎨 **New Features:**
- **✨ Featured Work Gallery** - Auto-scrolling gallery on home page showcasing admin-selected photos
- **📸 Profile Picture System** - Upload, crop, and manage profile pictures with DigitalOcean Spaces storage
- **👤 Enhanced Profile Management** - Tabbed interface for better organization and user experience
- **⭐ Featured Photo Selection** - Admin can star photos to feature on home page gallery
- **🖼️ Inline Photo Editor** - Admin can click photos on About page to update them directly
- **📝 Display Name Editing** - Users can customize their display name
- **🎯 Professional Animations** - Smooth transitions and professional gallery effects

### 🔧 **Improvements:**
- **📱 Better Mobile Experience** - Responsive design for all new features
- **⚡ Performance Optimized** - CDN delivery for all images
- **🎨 Professional UI/UX** - Clean, modern interface design
- **🔄 Real-time Updates** - Changes reflect immediately across the site

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

- **Email:** admin@yourdomain.com
- **Password:** (Set during initial setup - change immediately in production)

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

### v2.2.1 (Current) - Enhanced Invoice System
- **📧 NEW:** Email invoice as PDF functionality with professional HTML template
- **📦 NEW:** Package dropdown selection in invoice items with auto-fill
- **👤 NEW:** Auto-populate client name and email when user account is linked
- **💰 NEW:** Real-time total calculation from invoice line items
- **🎯 IMPROVED:** Moved "Link to User Account" to top of invoice form
- **🎨 IMPROVED:** Enhanced invoice form layout and user experience

### v2.2.0 - Discount Codes & Bulk Email
- **🎟️ NEW:** Complete discount code system with percentage or fixed amount discounts
- **💰 NEW:** Package price autofill in quote and booking forms
- **📧 NEW:** Bulk email system for promotional campaigns and announcements
- **🎯 NEW:** Discount code integration in session requests, quotes, and bookings
- **📊 NEW:** Discount code management interface in Pricing tab
- **🎨 IMPROVED:** Real-time discount validation and total calculation
- **📧 IMPROVED:** Email templates for deals, holidays, special pricing, and more
- **👥 IMPROVED:** Flexible recipient selection for bulk emails
- **🐛 FIXED:** Input field readability with improved text contrast
- **🐛 FIXED:** Browser autofill styling issues

### v2.1.0 - Unified Session & Invoicing System
- **🔄 MAJOR:** Complete consolidation of bookings and sessions into unified system
- **📊 NEW:** Full quote-to-invoice workflow with status tracking (request → quoted → booked → paid → invoiced)
- **💼 NEW:** Dedicated Sessions tab with comprehensive session management
- **💰 NEW:** Dedicated Invoicing tab for standalone and session-linked invoices
- **📈 NEW:** Financial metrics dashboard with real-time calculations
- **🎯 IMPROVED:** Streamlined admin dashboard with refactored tab structure
- **🎨 IMPROVED:** Enhanced form readability with proper color contrast
- **🔄 IMPROVED:** Database schema consolidation for single source of truth
- **🐛 FIXED:** Migration trigger errors
- **🐛 FIXED:** Invoice field name references
- **🐛 FIXED:** Color contrast issues in form modals

### v2.0.3 - Session Management & Business Tools
- **📋 NEW:** Enhanced session management table with filtering, sorting, and search
- **📧 NEW:** Email template system with pre-filled client communication templates
- **📅 NEW:** Interactive calendar with clickable days showing session details
- **💼 NEW:** Package and addon selection in booking forms and session tracking
- **📄 NEW:** PDF export functionality for session details
- **🎨 NEW:** Floating particles and aurora hero animations
- **💰 IMPROVED:** Accurate revenue calculations (only invoiced sessions count)
- **🔄 IMPROVED:** Session detail modals for easy viewing and editing
- **🎨 IMPROVED:** Enhanced table design with gold headers and better readability
- **🛡️ IMPROVED:** Photo protection and security enhancements
- **🐛 FIXED:** Black screen issue when clicking shoots in admin dashboard
- **🐛 FIXED:** Storage stats endpoint error handling
- **🐛 FIXED:** Session authentication improvements

### v2.0.2 - Enhanced User Experience
- **✨ NEW:** Auto-scrolling featured work gallery on home page
- **📸 NEW:** Profile picture upload system with cropping and DigitalOcean Spaces storage
- **👤 NEW:** Tabbed profile management interface for better organization
- **⭐ NEW:** Featured photo selection system for admin
- **🖼️ NEW:** Inline photo editor for About page (admin can click photos to update)
- **📝 NEW:** Display name editing for personalized user experience
- **🎯 NEW:** Professional animations and smooth transitions
- **📱 IMPROVED:** Enhanced mobile responsiveness
- **⚡ IMPROVED:** CDN-optimized image delivery
- **🎨 IMPROVED:** Modern, professional UI/UX design

### v2.0.1 - Bug Fixes
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

- **Email:** admin@yourdomain.com
- **Location:** Raleigh/Durham, NC
- **Website:** [Live Site](https://skylit-website-86r3u.ondigitalocean.app)

## License

MIT