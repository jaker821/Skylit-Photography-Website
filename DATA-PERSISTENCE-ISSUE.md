# 🔐 Admin Credentials Reset Issue - DigitalOcean Deployment

## Problem

After redeploying the app to DigitalOcean, the admin email and password reset back to `admin@skylit.com` and `admin123`, even after you've changed them on the live site.

---

## Root Cause

**DigitalOcean App Platform uses ephemeral storage:**
- The `/workspace/server/data/` directory is **temporary**
- On every deployment, the container is rebuilt from scratch
- All data files (`users.json`, `pricing.json`, etc.) are **lost**
- The server creates new files with default values

**Why this happens:**
1. You change admin credentials on the live site
2. Changes are saved to `/workspace/server/data/users.json`
3. You push code updates to GitHub
4. DigitalOcean rebuilds the container
5. `/workspace/server/data/` is **empty** (ephemeral storage)
6. Server creates new `users.json` with defaults
7. ❌ **Your changes are gone!**

---

## Current Temporary Fix (Just Applied)

I've updated the server to:
1. ✅ **Check if `users.json` exists** before creating it
2. ✅ **Only create default admin if file is missing**
3. ✅ **Log when preserving vs creating**

**However, this doesn't solve the core issue** - the file is still lost on deployment because the directory is ephemeral.

---

## Permanent Solutions

### Option 1: Use DigitalOcean Managed Database (Recommended)

**Benefits:**
- ✅ Persistent data (never lost)
- ✅ Automatic backups
- ✅ Scalable
- ✅ Professional solution

**Cost:**
- Basic PostgreSQL: $15/month
- Development PostgreSQL: $7/month (50% off for 6 months)

**What needs to change:**
- Replace JSON files with database
- Use PostgreSQL or MongoDB
- Update all data operations

### Option 2: Store Data Files in DigitalOcean Spaces

**Benefits:**
- ✅ Persistent storage (like images)
- ✅ Already have Spaces set up
- ✅ Cheaper than database
- ✅ Minimal code changes

**Cost:**
- Already included if using Spaces for images
- $5/month base fee covers 250GB

**What needs to change:**
- Read/write JSON files to Spaces instead of local disk
- Use S3 SDK (already installed)
- Update file operations

### Option 3: Environment Variables for Admin Only

**Benefits:**
- ✅ Free
- ✅ Simple
- ✅ Admin credentials never change

**Limitations:**
- ❌ Only works for admin account
- ❌ Other users still reset on deployment
- ❌ Pricing/packages/sessions still lost

**Implementation:**
- Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in DigitalOcean
- Server uses these instead of defaults
- User accounts still need database/Spaces

---

## Immediate Workaround (Option 3)

### Step 1: Set Environment Variables in DigitalOcean

1. Go to DigitalOcean → Your App → **Settings**
2. Scroll to **App-Level Environment Variables**
3. Add these variables:

```
ADMIN_EMAIL = your-desired-email@example.com
ADMIN_PASSWORD = YourSecurePassword123!
```

4. Click **Save**
5. Click **Actions** → **Restart**

### Step 2: On First Deployment

After setting env variables:
1. Deploy the updated code (with my changes)
2. Server will create admin with YOUR credentials
3. Admin login will be your custom email/password

### Step 3: Changing Admin Credentials Later

**To change them:**
1. Update the environment variables in DigitalOcean
2. **Manually delete** `server/data/users.json` via console
3. Restart the app
4. Server creates admin with new credentials

---

## Why Other Data Also Resets

**Everything in `/workspace/server/data/` is lost:**
- ❌ `users.json` - All user accounts
- ❌ `pricing.json` - Custom pricing packages
- ❌ `bookings.json` - All sessions/bookings
- ❌ `shoots.json` - Portfolio shoots metadata
- ❌ `invoices.json` - All invoices
- ❌ `expenses.json` - All expenses

**Only images persist** because they're stored in DigitalOcean Spaces!

---

## Recommended Path Forward

### Short-term (Now):
1. ✅ Use environment variables for admin credentials
2. ✅ Update code (already done)
3. ✅ Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in DigitalOcean

### Long-term (Next):
**Choose one:**

#### A. Use DigitalOcean Managed PostgreSQL
- Best for professional app
- Most reliable
- Industry standard
- $7-15/month

#### B. Use DigitalOcean Spaces for JSON Files
- Quick to implement
- Works with current structure
- Already have Spaces set up
- ~$5/month (already paying for images)

---

## Migration Guide: Spaces Storage for Data Files

If you want to use Spaces for data persistence, here's what needs to change:

### Files to Store in Spaces:
```
spaces-bucket/
├── data/
│   ├── users.json
│   ├── pricing.json
│   ├── bookings.json
│   ├── shoots.json
│   ├── invoices.json
│   └── expenses.json
└── portfolio/
    └── [photos already here]
```

### Code Changes Needed:
1. Update `readJSONFile()` to read from Spaces
2. Update `writeJSONFile()` to write to Spaces
3. Use AWS S3 SDK (already installed)
4. Initialize with defaults if not found in Spaces

### Estimated Time:
- ~2-3 hours to implement
- Requires testing

---

## What Happens Now (With Current Fix)

### On Fresh Deployment:
1. Server starts
2. Checks if `users.json` exists
3. Doesn't exist → Creates admin using env variables
4. `ADMIN_EMAIL` and `ADMIN_PASSWORD` are used
5. You can log in with your custom credentials

### On Restart (Without Deployment):
1. Server starts
2. `users.json` exists (still in container)
3. Skips creation → **Preserves existing data**
4. All users/data remain intact

### On Next Deployment:
1. Container rebuilt
2. `users.json` doesn't exist again
3. Creates admin using env variables again
4. ❌ Other users are still lost
5. ❌ Custom pricing/bookings/etc. are lost

---

## Decision Time

**You need to choose:**

### A. Keep Simple (Env Variables)
- **Pro:** Free, easy
- **Con:** Only admin persists, all other data resets
- **Use case:** Personal portfolio, minimal admin changes

### B. Upgrade to Database
- **Pro:** Everything persists, professional, scalable
- **Con:** $7-15/month
- **Use case:** Business use, multiple users, important data

### C. Use Spaces for Data
- **Pro:** Persistent, cheap, quick to implement
- **Con:** Not as robust as database
- **Use case:** Good middle ground

---

## Next Steps

1. **Set environment variables** in DigitalOcean (do this now):
   ```
   ADMIN_EMAIL = your-email@example.com
   ADMIN_PASSWORD = YourPassword123
   ```

2. **Deploy the updated code** (includes my fixes)

3. **Test:** Log in with your custom credentials

4. **Decide:** Database, Spaces, or keep it simple?

5. **If choosing Database or Spaces:** Let me know and I'll implement it

---

## Files Updated

- ✅ `server/server.js` - Now checks if file exists before creating
- ✅ Supports `ADMIN_EMAIL` and `ADMIN_PASSWORD` env variables
- ✅ Better logging for debugging

---

## Questions?

- Want me to implement Spaces storage for all data files?
- Need help setting up a PostgreSQL database?
- Have other questions about data persistence?

Let me know! 🚀

