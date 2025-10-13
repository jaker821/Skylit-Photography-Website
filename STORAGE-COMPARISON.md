# 📦 Photo Storage: Local vs. DigitalOcean Spaces

Quick comparison guide to help you understand the difference between local storage and DigitalOcean Spaces.

---

## 🆚 Side-by-Side Comparison

| Feature | Local Storage (`server/uploads/`) | DigitalOcean Spaces |
|---------|----------------------------------|---------------------|
| **Cost** | Free (included with app) | $5/month for 250GB + 1TB transfer |
| **Persistence** | ❌ Files deleted on deployment | ✅ Permanent storage |
| **Speed** | Slower (no CDN) | ⚡ Fast (global CDN) |
| **Scalability** | Limited by app storage | Virtually unlimited |
| **Setup Complexity** | ✅ Works out of the box | ⚠️ Requires configuration |
| **Best For** | Development/testing | Production deployment |

---

## 📁 Where Are Photos Currently Stored?

### Without Spaces Configuration:
```
Skylit_Photography v2/
├── server/
│   └── uploads/          ← Photos stored here
│       ├── 1697123456-789.jpg
│       ├── 1697123457-790.jpg
│       └── ...
```

**Photo URLs:**
```
http://localhost:5000/uploads/1697123456-789.jpg
```

**What Happens on Deployment:**
- ❌ All files in `server/uploads/` are **deleted**
- ❌ Every redeploy wipes your portfolio
- ❌ Not suitable for production

---

### With Spaces Configuration:
```
DigitalOcean Spaces Cloud Storage
└── skylit-photography/        ← Your Space (bucket)
    └── portfolio/             ← Organized folder
        ├── 1697123456-789.jpg
        ├── 1697123457-790.jpg
        └── ...
```

**Photo URLs:**
```
https://skylit-photography.nyc3.cdn.digitaloceanspaces.com/portfolio/1697123456-789.jpg
```

**What Happens on Deployment:**
- ✅ Files remain in Spaces permanently
- ✅ Fast CDN delivery worldwide
- ✅ Production-ready solution

---

## 🔄 How The Code Adapts

The application **automatically detects** which storage method to use based on environment variables:

### Detection Logic:
```javascript
// In server/server.js
const SPACES_ENABLED = !!(
  process.env.SPACES_ENDPOINT && 
  process.env.SPACES_BUCKET && 
  process.env.SPACES_ACCESS_KEY && 
  process.env.SPACES_SECRET_KEY
);
```

### Behavior:

**If Spaces variables are NOT set:**
```
⚠️  DigitalOcean Spaces is DISABLED
   Using local storage (files will be lost on deployment!)
   To enable Spaces, set: SPACES_ENDPOINT, SPACES_BUCKET, SPACES_ACCESS_KEY, SPACES_SECRET_KEY
```
→ Uses `server/uploads/` folder

**If Spaces variables ARE set:**
```
✅ DigitalOcean Spaces is ENABLED
```
→ Uses DigitalOcean Spaces with CDN

---

## 🛠️ Current Implementation Status

### ✅ What's Already Done:

1. **Code is Ready:**
   - ✅ AWS SDK integrated
   - ✅ Multer-S3 configured
   - ✅ Upload endpoint supports both methods
   - ✅ Delete endpoints support both methods
   - ✅ Automatic fallback to local storage

2. **Documentation Created:**
   - ✅ `DIGITALOCEAN-SPACES-SETUP.md` - Complete setup guide
   - ✅ `ENVIRONMENT-VARIABLES.md` - Updated with Spaces variables
   - ✅ `.do/app.yaml` - Configuration template ready

3. **Dependencies Installed:**
   - ✅ `aws-sdk` - For S3-compatible storage
   - ✅ `multer-s3` - For direct S3 uploads

### 📋 What You Need To Do:

1. **Create a DigitalOcean Space** (5-10 minutes)
   - Follow: [DIGITALOCEAN-SPACES-SETUP.md](./DIGITALOCEAN-SPACES-SETUP.md)
   
2. **Generate API Keys** (2 minutes)
   - Get Access Key and Secret Key from DigitalOcean
   
3. **Configure Environment Variables** (3 minutes)
   - Add 6 Spaces variables to `.env` (local)
   - Add 6 Spaces variables to App Platform (production)
   
4. **Deploy** (automatic)
   - Push changes to GitHub
   - DigitalOcean will automatically redeploy

**Total Setup Time: ~20 minutes**

---

## 🎯 Recommended Workflow

### For Development (Local):
```bash
# Option 1: Use local storage (default, no setup needed)
npm run dev:all

# Option 2: Use Spaces (same as production)
# 1. Add Spaces variables to .env
# 2. Run: npm run dev:all
```

### For Production (DigitalOcean):
```bash
# STRONGLY RECOMMENDED: Enable Spaces
# Otherwise photos will be lost on every deployment
```

---

## 📊 What Happens During Upload

### Local Storage Flow:
```
User uploads photo via Admin Panel
    ↓
Multer receives file
    ↓
File saved to: server/uploads/123456-789.jpg
    ↓
Database stores: { url: "/uploads/123456-789.jpg" }
    ↓
Browser displays: http://localhost:5000/uploads/123456-789.jpg
    ↓
⚠️  DEPLOYMENT → File deleted!
```

### Spaces Flow:
```
User uploads photo via Admin Panel
    ↓
Multer-S3 receives file
    ↓
File uploaded to: Spaces/portfolio/123456-789.jpg
    ↓
Database stores: { 
  url: "https://bucket.cdn.digitaloceanspaces.com/portfolio/123456-789.jpg",
  key: "portfolio/123456-789.jpg" 
}
    ↓
Browser displays via CDN (fast!)
    ↓
✅ DEPLOYMENT → File persists!
```

---

## 🔍 How To Check What's Being Used

### Method 1: Check Server Logs
When you start the server, look for:

```
✅ DigitalOcean Spaces is ENABLED
```
or
```
⚠️  DigitalOcean Spaces is DISABLED - Using local storage
```

### Method 2: Check Photo URLs
After uploading a photo in the admin panel:

**Local Storage URL:**
```
http://localhost:5000/uploads/1697123456-789.jpg
```

**Spaces URL:**
```
https://skylit-photography.nyc3.cdn.digitaloceanspaces.com/portfolio/1697123456-789.jpg
```

### Method 3: Check Environment Variables

**Local (.env file):**
```bash
# View your .env file
cat .env | grep SPACES
```

**Production (DigitalOcean):**
```
Go to: App → Settings → Environment Variables
Look for: SPACES_ENDPOINT, SPACES_BUCKET, etc.
```

---

## ⚠️ Important Notes

### About Existing Photos:

**If you already have photos in `server/uploads/`:**
1. They will continue to work locally
2. They will be **deleted** on next deployment
3. You should re-upload them after enabling Spaces

**Migration Strategy:**
- There is no automatic migration tool
- Simply re-upload photos through the admin panel
- Old photos in `server/uploads/` will be ignored once Spaces is enabled

### About Mixed Storage:

**Can I use both?**
- No - the app uses ONE storage method at a time
- If Spaces variables are set → Uses Spaces
- If Spaces variables are NOT set → Uses local storage
- You can't have some photos in local and some in Spaces

### About Testing:

**Testing Spaces locally:**
- Yes! Set Spaces variables in your `.env` file
- Your local app will upload to DigitalOcean Spaces
- Great for testing before production deployment

---

## 💰 Cost Breakdown

### Local Storage:
```
Cost: $0/month (FREE)
Limitations:
  - Files deleted on deployment
  - No CDN (slower loading)
  - Not production-ready
```

### DigitalOcean Spaces:
```
Base: $5/month
Includes:
  - 250 GB storage
  - 1 TB outbound transfer (CDN)
  - Unlimited inbound transfer
  
Typical Usage for Photography Portfolio:
  - 100 photos × 5MB each = 500MB
  - Well within the $5/month plan!
  
Overage Pricing:
  - Extra storage: $0.02/GB/month
  - Extra transfer: $0.01/GB
```

**Recommendation:** For a production photography portfolio, Spaces is well worth the $5/month for reliable, fast image delivery.

---

## 🚀 Quick Start Commands

### Check if Spaces is configured:
```bash
# Local
node -e "require('dotenv').config(); console.log('Spaces Enabled:', !!(process.env.SPACES_ENDPOINT && process.env.SPACES_BUCKET && process.env.SPACES_ACCESS_KEY && process.env.SPACES_SECRET_KEY))"

# Should output: "Spaces Enabled: true" or "Spaces Enabled: false"
```

### View your current storage:
```bash
# Local storage files
ls -lh server/uploads/

# Or for Windows:
dir server\uploads
```

### View Spaces files:
```
Login to: https://cloud.digitalocean.com/spaces
Navigate to: Your Space → Browse Files
```

---

## 📚 Next Steps

1. **For Local Development:**
   - Continue using local storage (no setup needed)
   - Or configure Spaces to match production

2. **For Production Deployment:**
   - **MUST** set up Spaces to avoid data loss
   - Follow: [DIGITALOCEAN-SPACES-SETUP.md](./DIGITALOCEAN-SPACES-SETUP.md)

3. **After Spaces Setup:**
   - Test photo upload locally
   - Deploy to production
   - Verify photos persist after deployment

---

**Need Help?** See [DIGITALOCEAN-SPACES-SETUP.md](./DIGITALOCEAN-SPACES-SETUP.md) for detailed step-by-step instructions.

