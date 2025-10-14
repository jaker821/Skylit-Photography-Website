# 🔧 DigitalOcean Spaces Upload Troubleshooting Checklist

## Issue: Photos Not Uploading to Specific Shoot

---

## ✅ Critical Configuration Steps

### Step 1: Verify Your Spaces Bucket Exists
1. Log into [DigitalOcean Console](https://cloud.digitalocean.com/spaces)
2. Confirm your Space exists and note:
   - **Space Name:** (e.g., `skylit-photography`)
   - **Region:** (e.g., `nyc3`, `sfo3`, `sgp1`)
   - **Space URL:** `https://[bucket-name].[region].digitaloceanspaces.com`
   - **CDN URL:** `https://[bucket-name].[region].cdn.digitaloceanspaces.com`

### Step 2: Verify API Keys Are Valid
1. Go to **Spaces Object Storage** → **Access Keys** in DigitalOcean
   - In the left sidebar, click **"Spaces Object Storage"**
   - Then click the **"Access Keys"** or **"Manage Keys"** tab
2. Confirm your key exists and is active
3. **If uncertain, generate NEW keys:**
   - Click **"Generate New Key"**
   - Name it: `skylit-photography-upload-key`
   - **SAVE BOTH KEYS IMMEDIATELY** (Secret only shows once!)

### Step 3: Check Bucket Permissions ⚠️ **CRITICAL**

This is likely your issue! The server code removed ACL settings, so we need to ensure bucket-level permissions are correct.

**In DigitalOcean Space Settings:**

1. Go to your Space → **Settings** → **Permissions**
2. Under **"File Listing"**, select one of:
   - ✅ **"Public"** (Recommended - allows anyone to view portfolio images)
   - ⚠️ **"Private"** (Not recommended - photos won't display publicly)

3. **IMPORTANT:** If set to Private, you need to either:
   - Change to Public, OR
   - Update the server code to set ACL on each file (see fix below)

### Step 4: Configure CORS Settings

**In your Space:**

1. Go to **Settings** → **CORS Configurations**
2. Click **"Add CORS Configuration"**
3. Configure as follows:

```
Origin: *
Allowed Methods: GET, PUT, POST, DELETE, HEAD
Allowed Headers: *
Access-Control-Max-Age: 3600
```

Or be more specific:
```
Origin: https://your-app.ondigitalocean.app
Allowed Methods: GET, PUT, POST, DELETE
Allowed Headers: Content-Type, Authorization
```

4. Click **Save**

### Step 5: Set Environment Variables

**For Local Development (`.env` file):**

Create a `.env` file in your project root:

```env
SPACES_ENDPOINT=nyc3.digitaloceanspaces.com
SPACES_REGION=nyc3
SPACES_BUCKET=skylit-photography
SPACES_ACCESS_KEY=DO00ABC123XYZ456
SPACES_SECRET_KEY=your_actual_secret_key_here
SPACES_CDN_URL=https://skylit-photography.nyc3.cdn.digitaloceanspaces.com
```

**For Production (DigitalOcean App Platform):**

1. Go to your app → **Settings** → **App-Level Environment Variables**
2. Click **Edit**
3. Add each variable:

| Variable | Value | Type |
|----------|-------|------|
| `SPACES_ENDPOINT` | `nyc3.digitaloceanspaces.com` | Plain Text |
| `SPACES_REGION` | `nyc3` | Plain Text |
| `SPACES_BUCKET` | `your-bucket-name` | Plain Text |
| `SPACES_ACCESS_KEY` | `[Your Access Key]` | **Secret** ⚠️ |
| `SPACES_SECRET_KEY` | `[Your Secret Key]` | **Secret** ⚠️ |
| `SPACES_CDN_URL` | `https://your-bucket.nyc3.cdn.digitaloceanspaces.com` | Plain Text |

4. Click **Save**
5. **IMPORTANT:** Click **Actions** → **Force Rebuild and Deploy**

---

## 🔍 Verify Configuration

### Check 1: Server Logs

**If running locally:**
```bash
npm run dev:all
```

**If on DigitalOcean:**
1. Go to your app → **Runtime Logs**

**Look for:**
```
✅ DigitalOcean Spaces is ENABLED
📦 Spaces Config: {
  endpoint: 'nyc3.digitaloceanspaces.com',
  bucket: 'your-bucket-name',
  region: 'nyc3',
  cdnUrl: 'https://your-bucket.nyc3.cdn.digitaloceanspaces.com',
  hasAccessKey: true,
  hasSecretKey: true
}
```

**If you see this instead:**
```
⚠️ DigitalOcean Spaces is DISABLED - Using local storage
```
→ Environment variables are not set correctly!

### Check 2: Test Upload with Console Monitoring

1. Open your admin panel
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Try uploading a photo
5. Watch for errors:

**Success:**
```
🔑 Uploading to bucket: skylit-photography File: portfolio/1234567890-123.jpg
✅ Files uploaded successfully: 1
📸 Photo uploaded to Spaces: portfolio/1234567890-123.jpg
```

**Error Examples:**
- `Access Denied` → API keys are wrong or bucket permissions issue
- `NoSuchBucket` → Bucket name is wrong
- `SignatureDoesNotMatch` → Secret key is wrong
- `InvalidAccessKeyId` → Access key is wrong

### Check 3: Verify Upload in Spaces

1. Go to DigitalOcean → Spaces → Your Bucket
2. Look for `portfolio/` folder
3. Check if files are being created there
4. If files appear but don't display → permissions/CORS issue
5. If files don't appear → upload is failing (check keys)

---

## 🛠️ Common Issues & Fixes

### Issue 1: "Access Denied" Error

**Most likely cause:** Bucket is set to Private and ACL is not being set on upload

**Fix Option A (Recommended):**
Set bucket to Public:
1. Go to Space → Settings → Permissions
2. Change **File Listing** to **"Public"**
3. Click **Save**

**Fix Option B:**
Add ACL to server code (see below)

### Issue 2: Photos Upload But Don't Display

**Cause:** CORS or permissions issue

**Fix:**
1. Check browser console for CORS errors
2. Add CORS configuration (see Step 4 above)
3. Verify CDN URL is correct in environment variables
4. Try accessing photo URL directly in browser

### Issue 3: Wrong Region/Endpoint

**Symptoms:** Timeouts, connection errors

**Fix:**
Ensure `SPACES_ENDPOINT` matches your Space region:
- NYC3: `nyc3.digitaloceanspaces.com`
- SFO3: `sfo3.digitaloceanspaces.com`
- SGP1: `sgp1.digitaloceanspaces.com`
- FRA1: `fra1.digitaloceanspaces.com`

### Issue 4: Keys With Special Characters

**Cause:** Secret key contains characters that need escaping in .env

**Fix:**
Wrap the secret key in quotes:
```env
SPACES_SECRET_KEY="your/secret+key/here=="
```

---

## 🔧 Server Code Fix (If Bucket Must Be Private)

If you need to keep your bucket private, update `server/server.js`:

Find this section (around line 170):
```javascript
storage = multerS3({
  s3: s3Client,
  bucket: process.env.SPACES_BUCKET,
  // Note: Removed ACL setting - bucket-level permissions will apply
  contentType: multerS3.AUTO_CONTENT_TYPE,
```

**Replace with:**
```javascript
storage = multerS3({
  s3: s3Client,
  bucket: process.env.SPACES_BUCKET,
  acl: 'public-read', // Add this line back
  contentType: multerS3.AUTO_CONTENT_TYPE,
```

This will make each uploaded file publicly readable regardless of bucket settings.

---

## 🧪 Complete Test Procedure

1. **Verify environment variables:**
   ```bash
   # If local, check .env file exists with all 6 variables
   # If production, check DigitalOcean Settings
   ```

2. **Restart application:**
   - Local: Stop and restart `npm run dev:all`
   - Production: Actions → Force Rebuild and Deploy

3. **Check logs for "Spaces is ENABLED"**

4. **Test upload:**
   - Log in as admin
   - Go to Portfolio → Open a shoot
   - Upload a test photo
   - Watch console for errors

5. **Verify in Spaces:**
   - Check DigitalOcean Spaces bucket
   - Look for `portfolio/[filename].jpg`

6. **Test display:**
   - Photo should appear in admin panel
   - Photo should appear on public portfolio page
   - Check photo URL in browser (should be CDN URL)

---

## 📋 Quick Reference: What You Need

Based on your Space with 250GB:

```env
# Example for NYC3 region - REPLACE WITH YOUR ACTUAL VALUES!
SPACES_ENDPOINT=nyc3.digitaloceanspaces.com
SPACES_REGION=nyc3
SPACES_BUCKET=your-actual-bucket-name
SPACES_ACCESS_KEY=DO00XXXXXXXXXXXX
SPACES_SECRET_KEY=your-secret-key-here
SPACES_CDN_URL=https://your-actual-bucket-name.nyc3.cdn.digitaloceanspaces.com
```

**To find your bucket name:**
- Go to DigitalOcean → Spaces
- It's the name shown in the list

**To find your region:**
- Look at your Space URL
- The part before `.digitaloceanspaces.com` is the region

**To find/create API keys:**
- DigitalOcean → Spaces Object Storage → Access Keys (or Manage Keys)

---

## 🚨 Emergency Reset Procedure

If nothing works:

1. **Generate brand new API keys:**
   - DigitalOcean → Spaces Object Storage → Access Keys
   - Delete old key (if any)
   - Click "Generate New Key"
   - Save both keys immediately

2. **Clear all environment variables in production:**
   - Remove all SPACES_* variables
   - Save
   - Add them back one by one
   - Save again

3. **Force rebuild:**
   - Actions → Force Rebuild and Deploy

4. **Test immediately after deployment completes**

---

## 📞 Still Having Issues?

**Provide this information:**

1. **Server logs showing Spaces config:**
   - Does it say "ENABLED" or "DISABLED"?
   - What values are shown for bucket, endpoint, etc.?

2. **Exact error message:**
   - From browser console (F12)
   - From server logs

3. **What happens when you upload:**
   - Any error messages?
   - Does file appear in Spaces bucket?
   - Does file display on page?

4. **Bucket configuration:**
   - Is bucket set to Public or Private?
   - What region is it in?

---

**Most Common Fix:** 🎯

**99% of the time, the issue is one of these:**

1. ✅ Set bucket permissions to **Public**
2. ✅ Add all 6 environment variables
3. ✅ Restart the application
4. ✅ Wait 30 seconds, try upload again

Good luck! 🚀

