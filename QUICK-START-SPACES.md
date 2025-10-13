# ⚡ Quick Start: DigitalOcean Spaces Setup

**Time Required:** 20 minutes  
**Cost:** $5/month  
**Difficulty:** Easy

---

## 🎯 What This Does

Prevents your portfolio photos from being deleted every time you deploy your website.

**Without Spaces:** Photos deleted on every deployment ❌  
**With Spaces:** Photos stored permanently with fast CDN delivery ✅

---

## 📋 Setup Checklist

### Step 1: Create Space (5 min)
- [ ] Log into [DigitalOcean](https://cloud.digitalocean.com/)
- [ ] Click **Create** → **Spaces Object Storage**
- [ ] Choose region: **NYC3** (closest to Raleigh/Durham)
- [ ] Enable CDN: **Yes**
- [ ] Name: `skylit-photography`
- [ ] Click **Create Space**
- [ ] **Save** the Space URL and CDN URL

### Step 2: Generate API Keys (2 min)
- [ ] Go to **API** → **Spaces Keys**
- [ ] Click **Generate New Key**
- [ ] Name: `skylit-photography-upload-key`
- [ ] **Copy** Access Key and Secret Key immediately
- [ ] Store them securely (password manager)

### Step 3: Configure Local Development (3 min)
- [ ] Open `.env` file in project root
- [ ] Add these lines:
```env
SPACES_ENDPOINT=nyc3.digitaloceanspaces.com
SPACES_REGION=nyc3
SPACES_BUCKET=skylit-photography
SPACES_ACCESS_KEY=your_access_key_here
SPACES_SECRET_KEY=your_secret_key_here
SPACES_CDN_URL=https://skylit-photography.nyc3.cdn.digitaloceanspaces.com
```
- [ ] Replace `your_access_key_here` and `your_secret_key_here` with your actual keys
- [ ] Save `.env` file

### Step 4: Configure Production (5 min)
- [ ] Go to your [DigitalOcean App](https://cloud.digitalocean.com/apps)
- [ ] Click **Settings** → **App-Level Environment Variables**
- [ ] Click **Edit**
- [ ] Add each variable:

| Variable | Value | Type |
|----------|-------|------|
| `SPACES_ENDPOINT` | `nyc3.digitaloceanspaces.com` | Plain Text |
| `SPACES_REGION` | `nyc3` | Plain Text |
| `SPACES_BUCKET` | `skylit-photography` | Plain Text |
| `SPACES_ACCESS_KEY` | Your Access Key | **Secret** |
| `SPACES_SECRET_KEY` | Your Secret Key | **Secret** |
| `SPACES_CDN_URL` | `https://skylit-photography.nyc3.cdn.digitaloceanspaces.com` | Plain Text |

- [ ] Click **Save**

### Step 5: Deploy (5 min)
- [ ] Commit changes:
```bash
git add .
git commit -m "Add DigitalOcean Spaces integration"
git push origin main
```
- [ ] Wait for automatic deployment (2-3 minutes)
- [ ] Check server logs for: `✅ DigitalOcean Spaces is ENABLED`

### Step 6: Test (2 min)
- [ ] Log into your live website
- [ ] Go to Admin Dashboard → Portfolio
- [ ] Create a test shoot and upload a photo
- [ ] Check your Space in DigitalOcean dashboard
- [ ] Verify photo appears in `portfolio/` folder
- [ ] Redeploy your app
- [ ] Confirm photo is still there ✅

---

## ✅ Verification

### You'll know it's working when:

1. **Server Logs Show:**
```
✅ DigitalOcean Spaces is ENABLED
```

2. **Photo URLs Look Like:**
```
https://skylit-photography.nyc3.cdn.digitaloceanspaces.com/portfolio/1697123456-789.jpg
```

3. **Photos Survive Deployment:**
   - Upload a photo
   - Redeploy your app
   - Photo is still visible ✅

---

## 🆘 Troubleshooting

### Problem: Server logs show "Spaces is DISABLED"
**Solution:**
- Check all 6 environment variables are set
- Verify no typos in variable names
- Restart server after adding variables

### Problem: Photos not uploading
**Solution:**
- Check Access Key and Secret Key are correct
- Verify bucket name matches exactly
- Check DigitalOcean API key has read/write permissions

### Problem: Photos not displaying
**Solution:**
- Check browser console for errors
- Verify CDN URL is correct
- Ensure files have public-read permissions

---

## 🔗 Need More Details?

See the comprehensive guide: [DIGITALOCEAN-SPACES-SETUP.md](./DIGITALOCEAN-SPACES-SETUP.md)

---

## 💡 Pro Tips

1. **Test locally first** - Add Spaces variables to `.env` and test uploads before deploying
2. **Use CDN URL** - Much faster than direct Spaces URL
3. **Monitor usage** - Check your Space dashboard to see storage and bandwidth
4. **Enable CDN** - Make sure CDN is enabled on your Space for best performance

---

## 📊 What You Get

✅ **Permanent photo storage** - Never lose photos on deployment  
✅ **Fast global CDN** - Photos load quickly worldwide  
✅ **Scalable** - Handle thousands of photos  
✅ **Reliable** - 99.9% uptime SLA  
✅ **Affordable** - Only $5/month for typical usage  

---

**Ready to get started?** Follow the checklist above! 🚀

