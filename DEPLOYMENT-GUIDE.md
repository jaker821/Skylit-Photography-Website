# 🚀 Deployment Guide - DigitalOcean App Platform

This guide will walk you through deploying your Skylit Photography application to DigitalOcean App Platform with automatic deployments from GitHub.

---

## 📋 Prerequisites

- [x] GitHub account
- [x] DigitalOcean account ([Sign up here](https://www.digitalocean.com/))
- [x] Google OAuth credentials configured ([See GOOGLE-OAUTH-SETUP.md](./GOOGLE-OAUTH-SETUP.md))
- [x] Your code ready to push to GitHub

---

## 🎯 Part 1: Push to GitHub

### Step 1: Initialize Git Repository

```bash
# If you haven't initialized git yet
git init
```

### Step 2: Create a New Repository on GitHub

1. Go to [GitHub.com](https://github.com)
2. Click the **"+"** icon in the top right
3. Select **"New repository"**
4. Name it: `skylit-photography` (or your preferred name)
5. **DO NOT** initialize with README, .gitignore, or license (you already have these)
6. Click **"Create repository"**

### Step 3: Add Your Files and Push

```bash
# Add all files to git
git add .

# Commit your changes
git commit -m "Initial commit - Skylit Photography website"

# Add your GitHub repository as remote (replace with YOUR username and repo name)
git remote add origin https://github.com/YOUR_USERNAME/skylit-photography.git

# Push to GitHub
git branch -M main
git push -u origin main
```

✅ **Your code is now on GitHub!**

---

## 🌊 Part 2: Deploy to DigitalOcean

### Step 1: Create a New App

1. Log in to [DigitalOcean](https://cloud.digitalocean.com/)
2. Click **"Create"** → **"Apps"**
3. Choose **"GitHub"** as your source
4. Click **"Manage Access"** to authorize DigitalOcean to access your GitHub repositories
5. Select your **repository**: `skylit-photography`
6. Select **branch**: `main`
7. Check **"Autodeploy"** - This will automatically deploy when you push to GitHub
8. Click **"Next"**

### Step 2: Configure Your App

#### Component Configuration:
- **Type**: Web Service
- **Name**: `web` (or `skylit-photography`)
- **Environment**: Node.js
- **Build Command**: `npm run build`
- **Run Command**: `npm start`
- **HTTP Port**: `8080`

Click **"Next"**

### Step 3: Configure Environment Variables

Click **"Edit"** next to your component, then scroll to **"Environment Variables"**.

Add the following variables:

| Variable Name | Value | Type | Required? |
|--------------|--------|------|-----------|
| `NODE_ENV` | `production` | Plain Text | **✅ Required** |
| `PORT` | `8080` | Plain Text | **✅ Required** |
| `SESSION_SECRET` | `[Generate Random String]` | **Secret** | **✅ Required** |
| `FRONTEND_URL` | `${APP_URL}` | Plain Text | **✅ Required** |

**Google OAuth Variables (OPTIONAL - Currently Disabled):**

| Variable Name | Value | Type | Required? |
|--------------|--------|------|-----------|
| `GOOGLE_CLIENT_ID` | `[Your Google Client ID]` | **Secret** | ⚠️ Optional |
| `GOOGLE_CLIENT_SECRET` | `[Your Google Client Secret]` | **Secret** | ⚠️ Optional |
| `GOOGLE_CALLBACK_URL` | `${APP_URL}/api/auth/google/callback` | Plain Text | ⚠️ Optional |

> **Note:** Google OAuth is currently disabled. You can skip these variables and enable Google sign-in later if needed.

#### 🔑 How to Generate SESSION_SECRET:
Run this command in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output and use it as your `SESSION_SECRET`.

#### 📝 Notes:
- `${APP_URL}` is a DigitalOcean variable that automatically uses your app's URL
- Mark `SESSION_SECRET`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET` as **encrypted/secret**
- You can edit these later if needed

Click **"Save"** then **"Next"**

### Step 4: Select a Plan

- **Basic Plan**: $5/month (recommended for starting)
- **Instance Size**: Basic (512 MB RAM, 1 vCPU)

Click **"Next"**

### Step 5: Review and Launch

1. Review all your settings
2. Click **"Create Resources"**

🎉 **Your app is now deploying!**

---

## ⚙️ Part 3: Update Google OAuth Settings (OPTIONAL - Skip for Now)

> **Note:** Google OAuth is currently disabled. You can skip this section and enable it later if needed.

<details>
<summary>Click to expand Google OAuth setup instructions (for future use)</summary>

After your app is deployed, you'll get a URL like: `https://your-app-name.ondigitalocean.app`

### Update Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your **OAuth 2.0 Client ID**
4. Under **"Authorized JavaScript origins"**:
   - Add: `https://your-app-name.ondigitalocean.app`
5. Under **"Authorized redirect URIs"**:
   - Add: `https://your-app-name.ondigitalocean.app/api/auth/google/callback`
6. Click **"Save"**

### Enable in DigitalOcean:

1. Go to your app settings → Environment Variables
2. Add the three Google OAuth variables listed in Part 2
3. Redeploy your app

</details>

---

## 🔄 How Automatic Deployments Work

Now that your app is connected to GitHub:

1. **Make changes** to your code locally
2. **Commit** your changes:
   ```bash
   git add .
   git commit -m "Your commit message"
   ```
3. **Push to GitHub**:
   ```bash
   git push origin main
   ```
4. **DigitalOcean automatically deploys** your changes! 🎉

You can watch the deployment progress in the **DigitalOcean dashboard** → **Your App** → **"Deployments"** tab.

---

## 📊 Monitoring Your App

### View Logs:
1. Go to your app in DigitalOcean
2. Click **"Runtime Logs"**
3. See real-time server logs

### Check Deployment Status:
1. Click **"Deployments"** tab
2. See build and deployment history
3. View detailed logs for each deployment

---

## 🐛 Troubleshooting

### Build Failed?
- Check the **build logs** in DigitalOcean
- Make sure all dependencies are in `package.json`
- Verify your build command is correct

### App Won't Start?
- Check **runtime logs**
- Verify environment variables are set correctly
- Make sure `PORT` is set to `8080`

### Google OAuth Not Working?
**Note:** Google OAuth is currently disabled by default.
- To enable: Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` environment variables
- Verify your callback URL matches exactly
- Check that your DigitalOcean app URL is in Google's authorized origins

### CORS Errors?
- The app is configured to allow your DigitalOcean URL automatically
- If issues persist, check the `allowedOrigins` in `server/server.js`

---

## 💰 Data Persistence

⚠️ **IMPORTANT**: DigitalOcean App Platform uses ephemeral storage, meaning:
- Server data (user uploads, JSON files) **will be lost** on each deployment
- For production, you'll need to add a database (PostgreSQL) or cloud storage (DigitalOcean Spaces/AWS S3)

### Recommended Next Steps for Production:
1. **Add a managed database** (PostgreSQL on DigitalOcean)
2. **Add object storage** for user uploads (DigitalOcean Spaces)
3. Replace JSON file storage with database queries

---

## 🎨 Custom Domain (Optional)

To use your own domain (e.g., `www.skylitphotography.com`):

1. Go to your app in DigitalOcean
2. Click **"Settings"** → **"Domains"**
3. Click **"Add Domain"**
4. Follow the instructions to update your DNS settings

---

## 📝 Quick Reference Commands

```bash
# Check your current deployment
git status

# Commit and deploy changes
git add .
git commit -m "Description of changes"
git push origin main

# View remote repository
git remote -v

# Pull latest changes (if working with team)
git pull origin main
```

---

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] DigitalOcean app created and connected to GitHub
- [ ] Environment variables configured
- [ ] Google OAuth updated with production URL
- [ ] First deployment successful
- [ ] Test login functionality
- [ ] Test user registration
- [ ] Verify admin dashboard works
- [ ] Check all pages load correctly

---

## 🚨 Security Reminders

- ✅ **NEVER** commit `.env` file to GitHub
- ✅ Use **strong, random** `SESSION_SECRET` in production
- ✅ Keep Google OAuth credentials **encrypted** in DigitalOcean
- ✅ Regularly update dependencies
- ✅ Monitor deployment logs for errors

---

## 📞 Need Help?

- **DigitalOcean Docs**: https://docs.digitalocean.com/products/app-platform/
- **DigitalOcean Community**: https://www.digitalocean.com/community
- **GitHub Issues**: Create an issue in your repository

---

🎉 **Congratulations! Your Skylit Photography website is now live and auto-deploying!**

