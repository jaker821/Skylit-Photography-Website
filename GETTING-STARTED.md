# 🚀 Getting Started with Skylit Photography Website

## What's New? ✨

Your website now has a **complete backend server** that handles:

### ✅ Completed Features

1. **Server-Side Authentication** - NO localStorage! Everything is secure and server-based
2. **Pricing Management** - Admin can edit packages and add-ons from the dashboard
3. **Portfolio/Shoots System** - Admin can create shoots and upload photos
4. **File Upload** - Real image upload to server
5. **Session Management** - Secure, HTTP-only cookie sessions
6. **Custom Color Scheme** - Purple, gold, and cream colors applied
7. **Dark/Light Mode Toggle** - Theme switcher in navigation

## 🎯 Quick Start (3 Simple Steps)

### Step 1: Install Everything
```bash
npm install
```

This installs all frontend and backend dependencies.

### Step 2: Start the Application
```bash
npm run dev:all
```

This starts BOTH the frontend and backend servers simultaneously.

### Step 3: Open Your Browser
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 🔐 Login Credentials

### Admin Account (Alina)
- Email: `admin@skylit.com`
- Password: `admin123`
- Access: Everything (Pricing, Portfolio, all admin features)

### Demo User Account
- Email: `user@example.com`
- Password: `user123`
- Access: Book sessions, view bookings

## 📸 What Alina Can Do (Admin Features)

### 1. Manage Pricing Packages
- Edit package prices, names, features
- Add new packages
- Delete packages
- Mark packages as "recommended"
- Changes appear immediately on the public Pricing page

### 2. Manage Add-Ons
- Edit add-on names and prices
- Add new add-ons
- Delete add-ons
- Changes appear immediately on the public Pricing page

### 3. Create Photo Shoots
- Create a new "Shoot" (collection of photos)
- Set shoot title, description, and date
- Choose category (Weddings, Engagements, Cars, etc.)
- Upload multiple photos to each shoot
- Delete photos or entire shoots
- All photos appear on the public Portfolio page

### 4. Manage Categories
Pre-configured categories include:
- Weddings, Engagements, Portraits, Family
- Newborn, Maternity, Couples
- **Cars, Motorcycles, Animals** (as requested!)
- Events, Lifestyle, Fashion, Headshots
- Real Estate, Products, Nature, Other

You can add more categories anytime!

## 📁 Where Everything is Stored

All data is stored in **human-readable JSON files**:

```
server/
├── data/
│   ├── users.json       # User accounts (admin & clients)
│   ├── pricing.json     # Packages & add-ons
│   ├── shoots.json      # Portfolio shoots & categories
│   └── sessions.json    # Active login sessions
└── uploads/             # Uploaded photos
```

### Easy to Backup!
Just copy the `server/data/` and `server/uploads/` folders to backup everything.

## 🎨 Current Color Scheme

Your custom colors are now active:
- **Purple**: RGB(78, 46, 58) - `#4E2E3A`
- **Gold**: RGB(223, 208, 143) - `#DFD08F`
- **Cream White**: RGB(248, 238, 219) - `#F8EEDB`

## 📋 What Pages Exist

### Public Pages (Anyone Can Visit)
1. **Home** - Hero section, featured work, services
2. **Portfolio** - Gallery with category filtering
3. **Pricing** - Packages and add-ons (admin-editable)
4. **About** - Alina's bio and experience
5. **Contact** - Contact form and information
6. **Login** - User/admin authentication

### User Dashboard (Logged-in Clients)
- Book new sessions
- View booking history
- Manage account

### Admin Dashboard (Alina Only)
- **Overview** - Financial summary, upcoming sessions
- **Invoices** - Create and manage invoices
- **Expenses** - Track business expenses
- **Sessions** - Manage client bookings
- **Portfolio** - Create shoots, upload photos

## 🔧 Common Tasks

### As Admin, How to...

**Edit a Pricing Package:**
1. Login as admin
2. Go to Admin Dashboard
3. Click on the package to edit
4. Update price, name, or features
5. Save - changes are immediate!

**Add a New Package:**
1. Admin Dashboard → Pricing section
2. Click "Add New Package"
3. Fill in details
4. Save

**Create a Photo Shoot:**
1. Admin Dashboard → Portfolio tab
2. Click "Create New Shoot"
3. Enter title (e.g., "Sarah's Wedding")
4. Select category (e.g., "Weddings")
5. Add description (optional)
6. Click "Create Shoot"

**Upload Photos to a Shoot:**
1. Find your shoot in the Portfolio tab
2. Click "Upload Photos"
3. Select up to 20 images
4. Upload - they'll appear immediately!

**Delete a Photo:**
1. Find the shoot
2. Click on the photo
3. Click "Delete"
4. Photo is removed from server

## ⚠️ Important Notes

### No More localStorage!
- All authentication is server-side
- Sessions use secure HTTP-only cookies
- Logging out actually logs you out (no data stays in browser)
- Much more secure!

### File Uploads
- Max file size: 10MB per image
- Supported formats: JPG, PNG, GIF, WebP
- Files stored in `server/uploads/`
- Delete a shoot = automatically deletes all its photos

### Data Persistence
- All changes are saved immediately to JSON files
- No database setup required
- Easy to read and edit files manually if needed
- Perfect for getting started!

## 🐛 Troubleshooting

### Server Won't Start?
```bash
# Make sure port 5000 is free
# Kill any process using it if needed
```

### Can't Login?
- Make sure backend server is running
- Check browser console for errors
- Try clearing cookies and restarting

### Photos Not Uploading?
- Check file size (< 10MB)
- Verify file type (images only)
- Ensure you're logged in as admin

### Changes Not Saving?
- Check server console for errors
- Verify JSON files in `server/data/` exist
- Restart server if needed

## 📚 Documentation Files

1. **GETTING-STARTED.md** (this file) - Quick start guide
2. **BACKEND-SETUP.md** - Detailed backend documentation
3. **SETUP.md** - Original setup instructions
4. **PROJECT-OVERVIEW.md** - Complete feature list
5. **DARK-MODE-GUIDE.md** - Theme toggle documentation
6. **COLOR-GUIDE.md** - Color customization

## 🎓 Next Steps

1. **✅ Install and Start** - Run `npm run dev:all`
2. **✅ Login as Admin** - Test the admin features
3. **➡️ Add Real Users** - Edit `server/data/users.json`
4. **➡️ Update Pricing** - Use admin dashboard to set real prices
5. **➡️ Create Shoots** - Add real photo shoots
6. **➡️ Upload Photos** - Add Alina's actual photography

## 🚀 For Production

When ready to deploy:
1. Read **BACKEND-SETUP.md** → Deployment section
2. Add password hashing (bcrypt)
3. Set environment variables
4. Use HTTPS
5. Deploy to Heroku, Render, or VPS

## 💡 Pro Tips

- **Backup Regularly**: Copy `server/data/` and `server/uploads/`
- **Test First**: Try all features with demo data first
- **Organize Shoots**: Use descriptive titles for shoots
- **Categories Matter**: Choose the right category for discoverability
- **Quality Photos**: Compress images before upload for faster loading

---

## ✨ You're All Set!

Run this command and start exploring:
```bash
npm run dev:all
```

Login as admin and start managing the portfolio! 🎉📸

**Need Help?** Check the documentation files or the inline comments in the code.

