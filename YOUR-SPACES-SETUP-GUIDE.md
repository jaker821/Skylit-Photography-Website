# 🚀 Your DigitalOcean Spaces Setup Guide
## Quick Fix for Photo Upload Issues

---

## ✅ What I Fixed

I just added back the `acl: 'public-read'` setting to the server code that was missing. This was likely causing your upload errors.

**The fix means:** Each uploaded photo will automatically be set to publicly readable, regardless of your bucket's default permissions.

---

## 📋 Step-by-Step Setup (With Your Credentials)

You mentioned you have:
- ✅ Space created (250GB)
- ✅ Spaces URL
- ✅ CDN URL  
- ✅ Access Key
- ✅ Secret Key

### Step 1: Find Your Exact Values

Go to [DigitalOcean Spaces](https://cloud.digitalocean.com/spaces) and note:

**Example values:**
```
Space Name: skylit-photography-2024
Region: nyc3
Spaces URL: https://skylit-photography-2024.nyc3.digitaloceanspaces.com
CDN URL: https://skylit-photography-2024.nyc3.cdn.digitaloceanspaces.com
```

Your **bucket name** is the first part of the URL (e.g., `skylit-photography-2024`)
Your **region** is what comes before `.digitaloceanspaces.com` (e.g., `nyc3`)

---

### Step 2: Set Environment Variables

#### For Local Testing (Create `.env` file):

Create a file named `.env` in your project root:

```env
# Server
PORT=5000
NODE_ENV=development
SESSION_SECRET=some-random-secret-string-here

# Frontend
FRONTEND_URL=http://localhost:3000

# DigitalOcean Spaces - REPLACE WITH YOUR ACTUAL VALUES
SPACES_ENDPOINT=nyc3.digitaloceanspaces.com
SPACES_REGION=nyc3
SPACES_BUCKET=your-bucket-name-here
SPACES_ACCESS_KEY=your-access-key-here
SPACES_SECRET_KEY=your-secret-key-here
SPACES_CDN_URL=https://your-bucket-name.nyc3.cdn.digitaloceanspaces.com
```

**REPLACE:**
- `nyc3` with your actual region (could be `sfo3`, `sgp1`, `fra1`, etc.)
- `your-bucket-name-here` with your actual Space name
- `your-access-key-here` with your Access Key (starts with `DO00...`)
- `your-secret-key-here` with your Secret Key
- The full CDN URL with your actual CDN URL from DigitalOcean

#### For Production (DigitalOcean App Platform):

1. Go to https://cloud.digitalocean.com/apps
2. Click your app name
3. Click **Settings** tab
4. Click **App-Level Environment Variables**
5. Click **Edit**
6. Add these 6 variables:

| Variable Name | Value | Type |
|--------------|--------|------|
| `SPACES_ENDPOINT` | `nyc3.digitaloceanspaces.com` (your region) | Plain Text |
| `SPACES_REGION` | `nyc3` (your region) | Plain Text |
| `SPACES_BUCKET` | `your-bucket-name` | Plain Text |
| `SPACES_ACCESS_KEY` | `DO00XXXXX...` | **SECRET** ⚠️ |
| `SPACES_SECRET_KEY` | `your-secret-key` | **SECRET** ⚠️ |
| `SPACES_CDN_URL` | `https://your-bucket.nyc3.cdn.digitaloceanspaces.com` | Plain Text |

7. Click **Save**
8. Click **Actions** → **Force Rebuild and Deploy**

---

### Step 3: Configure Your Space (CORS Settings)

This allows your website to upload files to Spaces:

1. Go to your Space in DigitalOcean
2. Click **Settings** tab
3. Scroll to **CORS Configurations**
4. Click **Add CORS Configuration**
5. Fill in:

```
Origin: *
Allowed Methods: GET, PUT, POST, DELETE, HEAD
Allowed Headers: *
Access-Control-Max-Age: 3600
```

6. Click **Save**

**Or for more security (recommended for production):**
```
Origin: https://your-app.ondigitalocean.app
Allowed Methods: GET, PUT, POST, DELETE
Allowed Headers: Content-Type, Authorization
```

---

## 🧪 Testing

### Test Locally:

1. Make sure `.env` file is created with all values
2. Start the server:
   ```bash
   npm run dev:all
   ```
3. Look for this in the console:
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

4. **If you see this instead:**
   ```
   ⚠️ DigitalOcean Spaces is DISABLED
   ```
   → Your environment variables are not loading correctly!

5. Log in as admin (default: `admin@skylit.com` / `admin123`)
6. Go to **Admin Dashboard** → **Portfolio**
7. Create a test shoot or open existing one
8. Click **"Upload Photos"**
9. Select an image
10. Watch the browser console (F12) for errors
11. **Success looks like:**
    ```
    🔑 Uploading to bucket: your-bucket-name File: portfolio/1234567890-123.jpg
    ✅ Files uploaded successfully: 1
    📸 Photo uploaded to Spaces: portfolio/1234567890-123.jpg
    ```

12. **Verify in DigitalOcean:**
    - Go to your Space
    - Look for `portfolio/` folder
    - Your photo should be there!

### Test Production:

After deploying to DigitalOcean:

1. Go to your app → **Runtime Logs**
2. Look for "✅ DigitalOcean Spaces is ENABLED"
3. Log in as admin
4. Upload a test photo
5. Check DigitalOcean Space to verify file appears
6. **Redeploy your app** (to test persistence)
7. Photo should still be there! ✅

---

## 🔍 Common Errors & Solutions

### Error: "Access Denied" or "403 Forbidden"

**Cause:** Invalid API keys or permissions issue

**Fix:**
1. Double-check your Access Key and Secret Key
2. Make sure keys are not expired
3. Try generating NEW keys:
   - DigitalOcean → **Spaces Object Storage** → **Access Keys**
   - Click **Generate New Key**
   - Copy both keys immediately
   - Update environment variables

### Error: "NoSuchBucket" or "Bucket does not exist"

**Cause:** Bucket name is wrong

**Fix:**
1. Go to DigitalOcean → Spaces
2. Copy the EXACT bucket name
3. Update `SPACES_BUCKET` environment variable
4. Restart application

### Error: "SignatureDoesNotMatch"

**Cause:** Wrong Secret Key or special characters not escaped

**Fix:**
1. Verify Secret Key is copied correctly
2. If key has special characters, wrap in quotes:
   ```env
   SPACES_SECRET_KEY="your/secret+key/here=="
   ```
3. Try generating new keys

### Error: Still seeing "Spaces is DISABLED"

**Cause:** Environment variables not loading

**Local Fix:**
1. Verify `.env` file exists in project root
2. Check for typos in variable names
3. Restart server completely

**Production Fix:**
1. Verify all 6 variables are in DigitalOcean Settings
2. Click **Force Rebuild and Deploy**
3. Wait for deployment to complete
4. Check Runtime Logs

### Photos Upload But Don't Display

**Cause:** CORS issue or wrong CDN URL

**Fix:**
1. Add CORS configuration (see Step 3 above)
2. Verify `SPACES_CDN_URL` is correct
3. Try accessing photo URL directly in browser
4. Check browser console for CORS errors

---

## 📊 Verification Checklist

Before saying "it's fixed", verify all of these:

- [ ] Server logs show "✅ DigitalOcean Spaces is ENABLED"
- [ ] All 6 environment variables are set correctly
- [ ] CORS is configured in your Space settings
- [ ] Can upload a photo via admin panel without errors
- [ ] Photo appears immediately in the photo grid
- [ ] Photo file appears in DigitalOcean Space under `portfolio/` folder
- [ ] Photo displays on public portfolio page
- [ ] Photo URL contains CDN domain (not `/uploads/`)
- [ ] After redeploying app, photo still exists (persistence test)

---

## 🚨 Emergency Debug Mode

If nothing works, run this checklist:

1. **Check Region Match:**
   ```
   SPACES_ENDPOINT must match your Space region:
   - If Space is in NYC3 → nyc3.digitaloceanspaces.com
   - If Space is in SFO3 → sfo3.digitaloceanspaces.com
   - If Space is in SGP1 → sgp1.digitaloceanspaces.com
   ```

2. **Verify Keys Are Active:**
   - Go to DigitalOcean → API → Spaces Keys
   - Make sure your key is listed and active
   - If uncertain, delete old key and create new one

3. **Check Bucket Exists:**
   - Go to DigitalOcean → Spaces
   - Confirm your bucket is listed
   - Note its exact name

4. **Test Variables Are Set:**
   
   **Local:**
   Add this temporary code to `server/server.js` after line 150:
   ```javascript
   console.log('🔍 DEBUG - Environment variables:');
   console.log('SPACES_ENDPOINT:', process.env.SPACES_ENDPOINT);
   console.log('SPACES_REGION:', process.env.SPACES_REGION);
   console.log('SPACES_BUCKET:', process.env.SPACES_BUCKET);
   console.log('SPACES_ACCESS_KEY:', process.env.SPACES_ACCESS_KEY ? 'SET' : 'NOT SET');
   console.log('SPACES_SECRET_KEY:', process.env.SPACES_SECRET_KEY ? 'SET' : 'NOT SET');
   console.log('SPACES_CDN_URL:', process.env.SPACES_CDN_URL);
   ```
   
   **Production:**
   Check Runtime Logs for the "📦 Spaces Config" output

5. **Clear and Reset:**
   - Remove ALL Spaces variables
   - Restart app
   - Add variables back one at a time
   - Restart again

---

## 💡 Pro Tips

### Tip 1: Test with Postman/curl First

If admin panel isn't working, test the upload endpoint directly:

```bash
curl -X POST \
  http://localhost:5000/api/portfolio/shoots/1/photos \
  -H "Cookie: your-session-cookie" \
  -F "photos=@test-image.jpg"
```

This helps isolate if the issue is frontend or backend.

### Tip 2: Check File Sizes

Spaces has a 5GB per-file limit, but your server has a 10MB limit (line 216 of server.js).

If uploading large files fails:
```javascript
limits: { fileSize: 10 * 1024 * 1024 }, // Increase this if needed
```

### Tip 3: Use Different Buckets for Dev/Prod

Create two Spaces:
- `skylit-dev` for development
- `skylit-prod` for production

Use different environment variables in each environment.

---

## 📞 Still Stuck?

**Provide these details:**

1. **What error message do you see?**
   - From browser console (F12)
   - From server logs

2. **Server log output:**
   - Does it say "ENABLED" or "DISABLED"?
   - What values show in "📦 Spaces Config"?

3. **What happens when you upload:**
   - Does upload button show any message?
   - Does file appear in Space?
   - Does file appear in admin panel?

4. **Your Space info:**
   - What region? (nyc3, sfo3, etc.)
   - Bucket name?
   - Is CORS configured?

---

## ✅ Success!

When everything works, you should see:

1. **Server logs:**
   ```
   ✅ DigitalOcean Spaces is ENABLED
   ✅ Server running on http://localhost:5000
   ```

2. **Upload logs:**
   ```
   🔑 Uploading to bucket: your-bucket File: portfolio/123.jpg
   ✅ Files uploaded successfully: 1
   📸 Photo uploaded to Spaces: portfolio/123.jpg
   ```

3. **Photo URL format:**
   ```
   https://your-bucket.nyc3.cdn.digitaloceanspaces.com/portfolio/123.jpg
   ```
   (NOT `/uploads/123.jpg`)

4. **In DigitalOcean Space:**
   - Go to your Space
   - See `portfolio/` folder
   - See your uploaded files

5. **Persistence test:**
   - Upload photo
   - Redeploy app
   - Photo still exists ✅

---

## 🎉 What's Next?

Once uploads work:
- Upload your portfolio photos
- Test on multiple devices
- Share with clients
- Enjoy persistent, CDN-delivered images!

**Cost:** $5/month for 250GB storage + 1TB transfer
**Benefit:** Never lose photos on deployment again!

---

Good luck! 🚀📸

