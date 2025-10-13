# Backend Server Setup Guide

## 🎯 Overview

Your Skylit Photography website now has a **complete backend server** with:
- ✅ **Server-side authentication** (no localStorage!)
- ✅ **JSON file-based database** for easy data management
- ✅ **Session management** with express-session
- ✅ **File upload** for portfolio photos
- ✅ **Pricing management API** (admin can edit packages/add-ons)
- ✅ **Portfolio/Shoots management** (admin can create shoots and upload photos)

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

This installs both frontend and backend dependencies:
- `express` - Web server
- `cors` - Cross-origin requests
- `express-session` - Session management
- `multer` - File upload handling
- `concurrently` - Run multiple processes

### 2. Start Development

**Option A: Run Frontend & Backend Together** (Recommended)
```bash
npm run dev:all
```

**Option B: Run Separately**
```bash
# Terminal 1 - Backend Server
npm run server

# Terminal 2 - Frontend
npm run dev
```

### 3. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api

## 📁 File Structure

```
Skylit_Photography v2/
├── server/
│   ├── server.js           # Main backend server
│   ├── data/               # JSON data storage
│   │   ├── users.json      # User accounts
│   │   ├── pricing.json    # Packages & add-ons
│   │   ├── shoots.json     # Portfolio shoots
│   │   └── sessions.json   # Active sessions
│   └── uploads/            # Uploaded photos
├── src/                    # Frontend React app
└── package.json
```

## 🔐 Authentication System

### How It Works
1. **No localStorage** - Everything is server-side
2. **Session cookies** - Secure HTTP-only cookies
3. **Server validation** - All requests verified server-side
4. **JSON storage** - User data in `server/data/users.json`

### Default Users

**Admin Account:**
- Email: `admin@skylit.com`
- Password: `admin123`
- Role: admin

**User Account:**
- Email: `user@example.com`
- Password: `user123`
- Role: user

### API Endpoints

```javascript
POST   /api/auth/login        // Login user
POST   /api/auth/logout       // Logout user
GET    /api/auth/session      // Check current session
```

## 💰 Pricing Management

### Features
- Admin can create/edit/delete pricing packages
- Admin can create/edit/delete add-ons
- Changes reflect immediately on the public Pricing page
- All data stored in `server/data/pricing.json`

### API Endpoints

```javascript
GET    /api/pricing                    // Get all pricing data
PUT    /api/pricing/packages/:id       // Update package (admin only)
POST   /api/pricing/packages           // Add package (admin only)
DELETE /api/pricing/packages/:id       // Delete package (admin only)
PUT    /api/pricing/addons/:id         // Update add-on (admin only)
POST   /api/pricing/addons             // Add add-on (admin only)
DELETE /api/pricing/addons/:id         // Delete add-on (admin only)
```

### Pricing Data Structure

```json
{
  "packages": [
    {
      "id": 1,
      "name": "Essential",
      "price": 350,
      "duration": "1 hour",
      "features": ["Feature 1", "Feature 2"],
      "recommended": false
    }
  ],
  "addOns": [
    {
      "id": 1,
      "name": "Additional Hour",
      "price": 200
    }
  ]
}
```

## 📸 Portfolio/Shoots Management

### Features
- Admin creates "Shoots" (photo collections)
- Upload multiple photos per shoot
- Organize by categories
- Photos stored in `server/uploads/`
- Metadata in `server/data/shoots.json`

### Categories
Pre-configured categories:
- Weddings, Engagements, Portraits, Family
- Newborn, Maternity, Couples
- Cars, Motorcycles, Animals
- Events, Lifestyle, Fashion, Headshots
- Real Estate, Products, Nature, Other

### API Endpoints

```javascript
GET    /api/portfolio                        // Get all shoots & categories
GET    /api/portfolio/category/:category     // Filter by category
GET    /api/portfolio/shoots/:id             // Get single shoot
POST   /api/portfolio/shoots                 // Create shoot (admin)
PUT    /api/portfolio/shoots/:id             // Update shoot (admin)
DELETE /api/portfolio/shoots/:id             // Delete shoot (admin)
POST   /api/portfolio/shoots/:id/photos      // Upload photos (admin)
DELETE /api/portfolio/shoots/:shootId/photos/:photoId  // Delete photo
POST   /api/portfolio/categories             // Add category (admin)
```

### Shoot Data Structure

```json
{
  "categories": ["Weddings", "Portraits", ...],
  "shoots": [
    {
      "id": 1,
      "title": "Sarah & John's Wedding",
      "description": "Beautiful outdoor ceremony",
      "category": "Weddings",
      "date": "2025-11-15",
      "photos": [
        {
          "id": 1234567890,
          "url": "/uploads/filename.jpg",
          "filename": "filename.jpg",
          "originalName": "wedding-photo.jpg",
          "uploadedAt": "2025-10-13T..."
        }
      ],
      "createdAt": "2025-10-13T..."
    }
  ]
}
```

## 📤 File Upload

### Supported Formats
- JPEG/JPG
- PNG
- GIF
- WebP

### Limits
- Max file size: 10MB per image
- Max files per upload: 20 images at once

### How It Works
1. Admin uploads photos through admin dashboard
2. Multer handles file processing
3. Files saved to `server/uploads/`
4. Metadata saved to JSON
5. Images served at `/uploads/filename.jpg`

## 🔒 Security Features

### Session Management
- HTTP-only cookies (not accessible via JavaScript)
- 24-hour session expiration
- Server-side session validation
- Session data stored in `server/data/sessions.json`

### Admin Protection
```javascript
// Middleware checks user role
function requireAdmin(req, res, next) {
  if (!req.session.userId || req.session.userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
```

### File Upload Validation
- Type checking (images only)
- Size limits enforced
- Unique filenames prevent conflicts
- Malicious file detection

## 🗄️ Data Storage

All data stored in human-readable JSON files:

### `users.json`
```json
{
  "users": [
    {
      "id": 1,
      "email": "admin@skylit.com",
      "password": "admin123",
      "name": "Alina Suedbeck",
      "role": "admin"
    }
  ]
}
```

⚠️ **Production Note**: Use bcrypt to hash passwords!

### Advantages of JSON Files
- ✅ Easy to read and edit
- ✅ No database setup required
- ✅ Version control friendly
- ✅ Simple backups (copy files)
- ✅ Perfect for small-medium datasets

### Backup Your Data
```bash
# Copy all data files
cp -r server/data server/data-backup-$(date +%Y%m%d)

# Copy uploaded images
cp -r server/uploads server/uploads-backup-$(date +%Y%m%d)
```

## 🎨 Admin Dashboard Features

### Pricing Management
1. Go to Admin Dashboard → Overview
2. Edit existing packages inline
3. Add new packages
4. Delete packages
5. Same for add-ons

### Portfolio Management
1. Go to Admin Dashboard → Portfolio
2. Create new shoot (title, category, description)
3. Upload photos to shoot
4. Delete photos
5. Edit shoot details
6. Delete entire shoot

## 🔧 Configuration

### Change Server Port
Edit `server/server.js`:
```javascript
const PORT = process.env.PORT || 5000;  // Change 5000 to your port
```

### Change Frontend URL
Edit CORS settings in `server/server.js`:
```javascript
app.use(cors({
  origin: 'http://localhost:3000',  // Change to your frontend URL
  credentials: true
}));
```

### Session Secret
For production, use environment variable:
```javascript
session({
  secret: process.env.SESSION_SECRET || 'your-secret-here'
})
```

## 🚀 Deployment

### Development
Already configured! Just run:
```bash
npm run dev:all
```

### Production

**1. Build Frontend:**
```bash
npm run build
```

**2. Serve Frontend from Express:**
```javascript
// Add to server.js
app.use(express.static(path.join(__dirname, '../dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});
```

**3. Environment Variables:**
```bash
export NODE_ENV=production
export SESSION_SECRET=your-random-secret-here
export PORT=8080
```

**4. Start Server:**
```bash
node server/server.js
```

### Hosting Options

**Heroku, Render, Railway:**
- Add `"start": "node server/server.js"` to package.json
- Commit `server/data/` and `server/uploads/` or use cloud storage
- Set environment variables

**VPS (DigitalOcean, Linode):**
- Install Node.js
- Clone repository
- Run with PM2: `pm2 start server/server.js`
- Use nginx as reverse proxy

## 📊 Monitoring

### View Server Logs
The server logs all requests:
```
✅ Server running on http://localhost:5000
📁 Data stored in: /path/to/server/data
📸 Uploads stored in: /path/to/server/uploads
```

### Check Data Files
```bash
# View users
cat server/data/users.json

# View pricing
cat server/data/pricing.json

# View shoots
cat server/data/shoots.json

# List uploaded photos
ls -lh server/uploads/
```

## 🔄 API Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "error": "Error message here"
}
```

## 🛠️ Troubleshooting

### Server Won't Start
```bash
# Check if port is already in use
lsof -i :5000

# Kill process if needed
kill -9 <PID>
```

### CORS Errors
- Ensure server is running on port 5000
- Check frontend is on port 3000
- Verify `credentials: 'include'` in fetch calls

### Session Not Persisting
- Clear browser cookies
- Restart server
- Check `server/data/sessions.json` exists

### File Upload Fails
- Check `server/uploads/` directory exists
- Verify file size < 10MB
- Ensure correct file type (images only)
- Check disk space

### Data Not Saving
- Verify `server/data/` directory exists
- Check file permissions
- Look for server error logs

## 📚 API Testing

### Using Postman/Insomnia

**Login:**
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@skylit.com",
  "password": "admin123"
}
```

**Get Pricing:**
```
GET http://localhost:5000/api/pricing
```

**Create Shoot (requires admin session):**
```
POST http://localhost:5000/api/portfolio/shoots
Content-Type: application/json

{
  "title": "Test Shoot",
  "category": "Weddings",
  "description": "Test description"
}
```

## 🎓 Next Steps

1. **Add Real Users**: Edit `server/data/users.json`
2. **Update Pricing**: Use admin dashboard
3. **Upload Photos**: Create shoots and add images
4. **Customize Categories**: Add/remove photo categories
5. **Production Deploy**: Follow deployment guide above

## ⚠️ Important Notes

### For Production
- [ ] Hash passwords with bcrypt
- [ ] Use environment variables for secrets
- [ ] Enable HTTPS (secure: true in session config)
- [ ] Add rate limiting
- [ ] Implement CSRF protection
- [ ] Use cloud storage for uploads (S3, Cloudinary)
- [ ] Add input validation/sanitization
- [ ] Set up database (MongoDB, PostgreSQL) for scalability

### Limitations of JSON Storage
- Not suitable for thousands of users
- No concurrent write protection
- No complex queries
- Manual backups required

For high-traffic sites, migrate to:
- MongoDB (NoSQL)
- PostgreSQL (SQL)
- Firebase/Supabase (Backend-as-a-Service)

---

## 🎉 You're All Set!

Your backend server is ready to go. Start it with:
```bash
npm run dev:all
```

Then login as admin and start managing your portfolio! 📸✨

