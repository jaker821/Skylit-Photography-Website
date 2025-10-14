# 🚀 Spaces Quick Reference Card

## 📋 What You Need

From your DigitalOcean account, gather these 6 values:

| Variable | Where to Find | Example |
|----------|---------------|---------|
| **Bucket Name** | Spaces dashboard | `skylit-photography` |
| **Region** | From Spaces URL | `nyc3` |
| **Endpoint** | `[region].digitaloceanspaces.com` | `nyc3.digitaloceanspaces.com` |
| **CDN URL** | Space settings | `https://skylit-photography.nyc3.cdn.digitaloceanspaces.com` |
| **Access Key** | Spaces → Access Keys | `DO00ABC123...` |
| **Secret Key** | Spaces → Access Keys (shown once!) | `xyz789abc...` |

---

## ⚡ Quick Setup

### Local Development:

1. **Create `.env` file:**
```env
SPACES_ENDPOINT=nyc3.digitaloceanspaces.com
SPACES_REGION=nyc3
SPACES_BUCKET=your-bucket-name
SPACES_ACCESS_KEY=DO00ABC123
SPACES_SECRET_KEY=xyz789abc
SPACES_CDN_URL=https://your-bucket.nyc3.cdn.digitaloceanspaces.com
```

2. **Start server:**
```bash
npm run dev:all
```

3. **Verify:**
Look for: `✅ DigitalOcean Spaces is ENABLED`

### Production:

1. **Add variables** in DigitalOcean → Settings → Environment Variables
2. **Mark as SECRET:** `SPACES_ACCESS_KEY` and `SPACES_SECRET_KEY`
3. **Deploy:** Push code or Force Rebuild
4. **Check logs:** Should say "Spaces is ENABLED"

---

## 🔍 Quick Diagnostics

### Run this first:
```bash
node check-spaces-config.js
```

### Check server logs for:
```
✅ DigitalOcean Spaces is ENABLED
```

### If you see:
```
⚠️ DigitalOcean Spaces is DISABLED
```
→ Environment variables are not set!

---

## 🐛 Common Errors

| Error | Fix |
|-------|-----|
| `Access Denied` | Wrong API keys - regenerate them |
| `NoSuchBucket` | Wrong bucket name - check spelling |
| `SignatureDoesNotMatch` | Wrong secret key - copy it again |
| `Spaces is DISABLED` | Environment variables not set |
| Photos don't display | Add CORS config to Space |

---

## ✅ Success Checklist

- [ ] Server logs show "Spaces is ENABLED"
- [ ] Upload photo → no error
- [ ] Photo appears in admin panel
- [ ] Photo appears in Space → `portfolio/` folder
- [ ] Photo URL is CDN URL (not `/uploads/`)
- [ ] Redeploy app → photo still exists

---

## 📚 Full Guides

- **Setup:** `YOUR-SPACES-SETUP-GUIDE.md`
- **Troubleshooting:** `SPACES-TROUBLESHOOTING-CHECKLIST.md`
- **Summary:** `PHOTO-UPLOAD-FIX-SUMMARY.md`
- **Template:** `env-template.txt`

---

## 🆘 Emergency Fix

If nothing works:

1. Go to DigitalOcean → Spaces Object Storage → Access Keys
2. **Delete old key**
3. **Generate new key**
4. **Copy both keys immediately**
5. Update all 6 environment variables
6. **Restart application**
7. Test upload

---

## 💡 Pro Tips

- **Bucket name** = first part of Spaces URL before `.`
- **Region** = first part of endpoint before `.digitaloceanspaces.com`
- **CDN URL** must have `.cdn.` in it
- **Access Key** starts with `DO00`
- Always restart after changing environment variables
- Use config checker: `node check-spaces-config.js`

---

## 🎯 Most Common Fix

**95% of issues are solved by:**

1. Double-check all 6 variables are set correctly
2. Restart the application
3. Wait 30 seconds
4. Try upload again

---

## 📞 Getting Help

When asking for help, provide:
1. Error message from browser console (F12)
2. Server log output (show Spaces config)
3. Does it say "ENABLED" or "DISABLED"?
4. What happens when you upload?

---

**Time to fix:** 10-15 minutes  
**Difficulty:** Easy  
**Cost:** $5/month

**You got this!** 🚀📸

