# 📸 Photo Upload Troubleshooting Guide

## Problem: Photos Not Uploading to Website or DigitalOcean Spaces

---

## ✅ Step 1: Check if Spaces is Configured

### Check DigitalOcean Runtime Logs:

1. Go to [cloud.digitalocean.com/apps](https://cloud.digitalocean.com/apps)
2. Click your app → **"Runtime Logs"** tab
3. Look for this message on server startup:

**If Spaces IS configured:**
```
✅ DigitalOcean Spaces is ENABLED
```

**If Spaces is NOT configured:**
```
⚠️ DigitalOcean Spaces is DISABLED - Using local storage (files will be lost on deployment!)
   To enable Spaces, set: SPACES_ENDPOINT, SPACES_BUCKET, SPACES_ACCESS_KEY, SPACES_SECRET_KEY
```

---

## 🔧 Step 2: Verify Environment Variables

### In DigitalOcean Dashboard:

1. Go to your app → **Settings** → **App-Level Environment Variables**
2. Verify ALL 6 Spaces variables are set:

| Variable | Should Be Set | Example Value |
|----------|---------------|---------------|
| `SPACES_ENDPOINT` | ✅ Yes | `nyc3.digitaloceanspaces.com` |
| `SPACES_REGION` | ✅ Yes | `nyc3` |
| `SPACES_BUCKET` | ✅ Yes | `your-bucket-name` |
| `SPACES_ACCESS_KEY` | ✅ Yes | `DO00...` (Secret) |
| `SPACES_SECRET_KEY` | ✅ Yes | `***` (Secret) |
| `SPACES_CDN_URL` | ✅ Yes | `https://your-bucket.nyc3.cdn.digitaloceanspaces.com` |

**If ANY are missing:**
- Add them following `DIGITALOCEAN-SPACES-SETUP.md`
- Click **Save**
- **Restart the app**

---

## 🧪 Step 3: Test Upload with Error Messages

**After the recent code update**, the admin panel will now show error messages when uploads fail:

1. **Go to Admin Dashboard → Portfolio**
2. **Open a shoot**
3. **Click "Upload Photos"**
4. **Select an image file**

**What you'll see:**

### ✅ Success:
```
Alert: "Photos uploaded successfully!"
```
The photos should appear immediately in the grid.

### ❌ Error (with details):
```
Alert: "Upload failed: [error message]"
```
Check browser console (F12) for detailed error.

---

## 🔍 Step 4: Common Issues & Solutions

### Issue 1: "Spaces is DISABLED" in logs

**Cause:** Environment variables not set

**Solution:**
1. Add all 6 Spaces variables to DigitalOcean
2. Restart the app
3. Check logs again

### Issue 2: "Access Denied" or "403 Forbidden"

**Cause:** Invalid API keys or bucket permissions

**Solution:**
1. Verify API keys are correct
2. Check Spaces Access Key has read/write permissions
3. Regenerate keys if needed in DigitalOcean → API → Spaces Keys

### Issue 3: "Bucket does not exist"

**Cause:** Bucket name mismatch

**Solution:**
1. Go to DigitalOcean → Spaces
2. Check your actual bucket name
3. Update `SPACES_BUCKET` variable to match exactly
4. Restart app

### Issue 4: Photos upload but don't display

**Cause:** CDN URL mismatch or CORS issue

**Solution:**
1. Check `SPACES_CDN_URL` is correct
2. Verify it ends with `.digitaloceanspaces.com`
3. Check Spaces CORS settings:
   - Go to Space → Settings → CORS Configurations
   - Add your app domain: `https://your-app.ondigitalocean.app`

### Issue 5: Local storage is being used instead of Spaces

**Cause:** Missing environment variables

**Check:**
- All 6 variables are set
- No typos in variable names
- App has been restarted after adding variables

---

## 📝 Step 5: Check What Storage is Being Used

### Method 1: Check Server Logs (Recommended)

After restarting, look for:
```
✅ DigitalOcean Spaces is ENABLED
✅ Server running on http://localhost:8080
```

### Method 2: Upload Test Photo

1. Upload a photo via admin panel
2. Look at the photo URL in browser dev tools (F12 → Network tab)

**Using Spaces:**
```
https://your-bucket.nyc3.cdn.digitaloceanspaces.com/portfolio/1234567890-123.jpg
```

**Using Local Storage:**
```
/uploads/1234567890-123.jpg  
```
⚠️ Local storage = photos will be lost on deployment!

---

## 🐛 Step 6: Get Detailed Error Messages

### Browser Console (F12):

1. Open admin panel
2. Press **F12** to open Developer Tools
3. Click **Console** tab
4. Try uploading a photo
5. Look for red error messages

**Common errors you might see:**

| Error | Meaning | Solution |
|-------|---------|----------|
| `Network error` | Can't reach server | Check internet connection |
| `403 Forbidden` | Access denied | Check API keys |
| `404 Not Found` | Bucket doesn't exist | Check bucket name |
| `401 Unauthorized` | Not logged in | Re-login as admin |
| `500 Server Error` | Server crash | Check runtime logs |

### Server Logs:

1. Go to DigitalOcean → Your App → **Runtime Logs**
2. Try uploading a photo
3. Look for error messages in real-time

---

## ✅ Verification Checklist

After fixing configuration, verify:

- [ ] Runtime logs show "✅ DigitalOcean Spaces is ENABLED"
- [ ] All 6 environment variables are set
- [ ] Bucket exists in DigitalOcean Spaces
- [ ] API keys are valid (regenerate if unsure)
- [ ] Upload shows "Photos uploaded successfully!"
- [ ] Photos appear in admin panel immediately
- [ ] Photos appear in DigitalOcean Spaces bucket under `portfolio/` folder
- [ ] Photos display on public portfolio page
- [ ] Photo URLs contain CDN domain

---

## 🚨 Quick Diagnostic Command

### In DigitalOcean Console:

```bash
# Check if environment variables are set
env | grep SPACES

# Should show:
# SPACES_ENDPOINT=nyc3.digitaloceanspaces.com
# SPACES_REGION=nyc3
# SPACES_BUCKET=your-bucket-name
# SPACES_ACCESS_KEY=DO00...
# SPACES_SECRET_KEY=...
# SPACES_CDN_URL=https://...
```

If nothing shows or missing variables → Add them in Settings!

---

## 📞 Still Not Working?

**Collect this information:**

1. **Runtime logs** (last 50 lines)
2. **Environment variables** (list of names, not values)
3. **Error message** from browser console
4. **Photo URL** that was attempted to load

**Then review:**
- `DIGITALOCEAN-SPACES-SETUP.md` - Complete setup guide
- `STORAGE-COMPARISON.md` - How storage works

---

## 🎯 Most Likely Issue

**95% of photo upload issues are:**

1. ❌ Spaces environment variables not set in DigitalOcean
2. ❌ App not restarted after adding variables
3. ❌ Invalid API keys

**Quick fix:**
1. Double-check all 6 variables are in DigitalOcean Settings
2. Click **Actions** → **Restart** 
3. Wait 30 seconds
4. Try upload again

---

Good luck! 🚀

