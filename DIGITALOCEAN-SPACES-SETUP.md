# 📸 DigitalOcean Spaces Setup Guide
## Persistent Image Storage for Skylit Photography

---

## 🎯 Why DigitalOcean Spaces?

**The Problem:**
- DigitalOcean App Platform uses **ephemeral storage**
- Photos uploaded to `server/uploads/` are **deleted on every deployment**
- All portfolio images disappear when you redeploy your app

**The Solution:**
- **DigitalOcean Spaces** = S3-compatible object storage
- Photos are stored **permanently** in the cloud
- Fast CDN delivery worldwide
- Only **$5/month** for 250GB storage + 1TB transfer

---

## 📋 Step 1: Create a DigitalOcean Space

### 1.1 Create the Space

1. Log into [DigitalOcean](https://cloud.digitalocean.com/)
2. Click **"Create"** → **"Spaces Object Storage"**
3. **Choose a datacenter region:**
   - Recommended: **NYC3** (closest to Raleigh/Durham)
   - Or choose the region closest to your primary audience
4. **Configure the Space:**
   - **Enable CDN:** ✅ Yes (for faster image loading)
   - **Space Name:** `skylit-photography` (or your preferred name)
   - **Project:** Select your project
5. Click **"Create a Space"**

### 1.2 Note Your Space Details

After creation, you'll see:
```
Space URL: https://skylit-photography.nyc3.digitaloceanspaces.com
CDN URL:   https://skylit-photography.nyc3.cdn.digitaloceanspaces.com
```

**Save these URLs!** You'll need them for configuration.

---

## 🔑 Step 2: Create API Keys (Access Credentials)

### 2.1 Generate Spaces Access Keys

1. Go to **API** → **Spaces Keys** (left sidebar)
2. Click **"Generate New Key"**
3. **Name:** `skylit-photography-upload-key`
4. Click **"Generate Key"**

### 2.2 Save Your Credentials

You'll see:
```
Access Key: DO00ABC123XYZ456 (example)
Secret Key: xyz789abc123secretkey456 (example)
```

⚠️ **IMPORTANT:** 
- **Copy both keys immediately** - the secret key will only be shown once!
- Store them securely (password manager, .env file)
- Never commit these to Git!

---

## ⚙️ Step 3: Configure Your Application

### 3.1 Update `.env` File (Local Development)

Add these lines to your `.env` file:

```env
# DigitalOcean Spaces Configuration
SPACES_ENDPOINT=nyc3.digitaloceanspaces.com
SPACES_REGION=nyc3
SPACES_BUCKET=skylit-photography
SPACES_ACCESS_KEY=DO00ABC123XYZ456
SPACES_SECRET_KEY=xyz789abc123secretkey456
SPACES_CDN_URL=https://skylit-photography.nyc3.cdn.digitaloceanspaces.com
```

**Replace with your actual values:**
- `SPACES_ENDPOINT`: Your region endpoint (e.g., `nyc3`, `sfo3`, `sgp1`)
- `SPACES_BUCKET`: Your Space name
- `SPACES_ACCESS_KEY`: Your Access Key from Step 2
- `SPACES_SECRET_KEY`: Your Secret Key from Step 2
- `SPACES_CDN_URL`: Your CDN URL from Step 1

### 3.2 Add to `.gitignore`

Make sure `.env` is in your `.gitignore`:

```gitignore
# Environment variables
.env
.env.local
.env.production
```

---

## 🚀 Step 4: Configure DigitalOcean App Platform

### 4.1 Add Environment Variables to App Platform

1. Go to your app in [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Click **"Settings"** → **"App-Level Environment Variables"**
3. Click **"Edit"**
4. Add each variable individually:

| Variable Name | Value | Type |
|--------------|-------|------|
| `SPACES_ENDPOINT` | `nyc3.digitaloceanspaces.com` | Plain Text |
| `SPACES_REGION` | `nyc3` | Plain Text |
| `SPACES_BUCKET` | `skylit-photography` | Plain Text |
| `SPACES_ACCESS_KEY` | `[Your Access Key]` | **Secret** |
| `SPACES_SECRET_KEY` | `[Your Secret Key]` | **Secret** |
| `SPACES_CDN_URL` | `https://skylit-photography.nyc3.cdn.digitaloceanspaces.com` | Plain Text |

5. Click **"Save"**

⚠️ **Important:** Mark `SPACES_ACCESS_KEY` and `SPACES_SECRET_KEY` as **Secret** type!

---

## 🔧 Step 5: Update Your Code

### 5.1 Code Changes Already Implemented

The following files have been updated to use DigitalOcean Spaces:

✅ **`server/server.js`**
- Configured AWS SDK for Spaces
- Updated multer to use S3 storage
- Modified photo upload endpoints
- Updated photo deletion to remove from Spaces

✅ **`package.json`**
- Added `aws-sdk` dependency
- Added `multer-s3` dependency

---

## 🧪 Step 6: Test the Integration

### 6.1 Test Locally

1. **Start your development server:**
   ```bash
   npm run dev:all
   ```

2. **Log in as admin**
3. **Go to Admin Dashboard → Portfolio**
4. **Create a new shoot and upload a photo**
5. **Check your DigitalOcean Space:**
   - Go to your Space in the DigitalOcean dashboard
   - You should see the uploaded photo in `portfolio/` folder

### 6.2 Verify Photo URLs

- Photos should have URLs like:
  ```
  https://skylit-photography.nyc3.cdn.digitaloceanspaces.com/portfolio/1234567890-123456789.jpg
  ```
- The CDN URL provides **fast, cached delivery** worldwide

---

## 🚢 Step 7: Deploy to Production

### 7.1 Push Your Changes

```bash
git add .
git commit -m "Add DigitalOcean Spaces integration for persistent image storage"
git push origin main
```

### 7.2 Wait for Deployment

- DigitalOcean App Platform will automatically deploy
- Usually takes 2-3 minutes
- Check the build logs for any errors

### 7.3 Test in Production

1. Log into your live site
2. Upload a photo through the admin panel
3. Verify it appears in your DigitalOcean Space
4. Check that the photo loads on the public portfolio page

---

## 📊 Step 8: Monitor Usage

### 8.1 Check Storage Usage

1. Go to your Space in DigitalOcean
2. View **Storage** tab to see:
   - Total files
   - Total size
   - Bandwidth used

### 8.2 Pricing Breakdown

**Base Plan: $5/month includes:**
- 250 GB storage
- 1 TB outbound transfer
- Unlimited inbound transfer

**Overage Pricing:**
- Additional storage: $0.02/GB/month
- Additional transfer: $0.01/GB

**Typical Usage for Photography Portfolio:**
- 100 high-res photos (~5MB each) = 500MB storage
- Well within the $5/month plan!

---

## 🔒 Security Best Practices

### Access Control

1. **Set proper CORS policy** on your Space:
   - Go to Space → Settings → CORS Configurations
   - Add your domain: `https://your-app.ondigitalocean.app`

2. **Use CDN URLs** for public access
3. **Keep API keys secret** - never commit to Git
4. **Rotate keys periodically** for security

### File Permissions

- Files are **private by default**
- Make files **public-read** during upload (already configured)
- This allows anyone to view photos via CDN URL

---

## 🛠️ Troubleshooting

### Problem: Photos not uploading

**Check:**
1. ✅ Environment variables are set correctly in App Platform
2. ✅ Access keys are valid
3. ✅ Space name matches `SPACES_BUCKET`
4. ✅ Region matches `SPACES_REGION`

**Solution:**
- Check DigitalOcean runtime logs for errors
- Verify API keys have read/write permissions

### Problem: Photos not displaying

**Check:**
1. ✅ Files are in the Space (check DigitalOcean dashboard)
2. ✅ Files have public-read permissions
3. ✅ CDN URL is correct in environment variables

**Solution:**
- Check browser console for 404 or CORS errors
- Verify CDN URL format: `https://bucket-name.region.cdn.digitaloceanspaces.com`

### Problem: "Access Denied" errors

**Check:**
1. ✅ Access keys are correct
2. ✅ Secret key matches access key
3. ✅ Keys haven't been deleted or rotated

**Solution:**
- Generate new API keys
- Update environment variables in App Platform

---

## 📦 Migration from Local Storage

### If You Have Existing Photos in `server/uploads/`

**Before Spaces integration:**
1. Download all photos from `server/uploads/`
2. Manually upload to your Space using the DigitalOcean dashboard
3. Or use the admin panel to re-upload photos

**Note:** Old photos in `server/uploads/` will be lost on next deployment

---

## 🎯 What Happens Now

### Before (Local Storage):
```
User uploads photo
    ↓
Saved to server/uploads/
    ↓
Lost on deployment ❌
```

### After (DigitalOcean Spaces):
```
User uploads photo
    ↓
Uploaded to Spaces via S3 API
    ↓
Stored permanently ✅
    ↓
Delivered via CDN (fast!) 🚀
```

---

## 📚 Additional Resources

- [DigitalOcean Spaces Documentation](https://docs.digitalocean.com/products/spaces/)
- [Spaces API Reference](https://docs.digitalocean.com/reference/api/spaces-api/)
- [AWS SDK for JavaScript](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/)
- [Multer S3 Documentation](https://www.npmjs.com/package/multer-s3)

---

## ✅ Checklist

Before going live, make sure:

- [ ] DigitalOcean Space created
- [ ] CDN enabled on Space
- [ ] API keys generated and saved
- [ ] Environment variables added to `.env`
- [ ] Environment variables added to App Platform
- [ ] Code changes committed and pushed
- [ ] Deployment successful
- [ ] Test photo upload works locally
- [ ] Test photo upload works in production
- [ ] Photos visible on public portfolio
- [ ] Old photos backed up (if any)

---

## 🎉 Success!

Once setup is complete, your photography portfolio will have:
- ✅ **Permanent photo storage**
- ✅ **Fast CDN delivery worldwide**
- ✅ **No data loss on deployments**
- ✅ **Professional, scalable infrastructure**
- ✅ **Only $5/month!**

Happy uploading! 📸✨

