# 🔐 Environment Variables Guide

This document lists all environment variables needed for the Skylit Photography application.

---

## 📝 Creating Your .env File

Create a file named `.env` in the root directory of your project with the following content:

```env
# ===================================
# Server Configuration
# ===================================
PORT=5000
NODE_ENV=development

# ===================================
# Google OAuth 2.0 Credentials
# ===================================
# Get these from: https://console.cloud.google.com/
# See GOOGLE-OAUTH-SETUP.md for detailed instructions

GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# ===================================
# Session Configuration
# ===================================
# Generate a strong random secret using:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

SESSION_SECRET=your_session_secret_here

# ===================================
# Application URLs
# ===================================
FRONTEND_URL=http://localhost:3000

# ===================================
# DigitalOcean Spaces (Optional - for persistent image storage)
# ===================================
# Get these from DigitalOcean Spaces dashboard
# See DIGITALOCEAN-SPACES-SETUP.md for detailed instructions

SPACES_ENDPOINT=nyc3.digitaloceanspaces.com
SPACES_REGION=nyc3
SPACES_BUCKET=your-bucket-name
SPACES_ACCESS_KEY=your_spaces_access_key
SPACES_SECRET_KEY=your_spaces_secret_key
SPACES_CDN_URL=https://your-bucket-name.nyc3.cdn.digitaloceanspaces.com
```

---

## 🔑 Variable Descriptions

### Required for Development:

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port number | `5000` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `SESSION_SECRET` | Secret key for session encryption | Generated random string |

### Optional (for Google OAuth - Currently Disabled):

**Note:** Google OAuth is currently disabled. You can enable it later by adding these variables.

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | [Google Cloud Console](https://console.cloud.google.com/) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | Google Cloud Console |
| `GOOGLE_CALLBACK_URL` | OAuth callback URL | `http://localhost:5000/api/auth/google/callback` (dev) |
| `FRONTEND_URL` | Frontend application URL | `http://localhost:3000` (dev) |

**To enable Google OAuth:** Simply add the Google credentials to your `.env` file and restart the server.

### Optional (for DigitalOcean Spaces - Recommended for Production):

**Note:** Without Spaces, images are stored locally and will be **deleted on every deployment**.

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `SPACES_ENDPOINT` | Spaces region endpoint | DigitalOcean Spaces dashboard (e.g., `nyc3.digitaloceanspaces.com`) |
| `SPACES_REGION` | Spaces region code | Match your endpoint (e.g., `nyc3`, `sfo3`, `sgp1`) |
| `SPACES_BUCKET` | Your Space name | Choose when creating Space |
| `SPACES_ACCESS_KEY` | Spaces API Access Key | DigitalOcean → API → Spaces Keys |
| `SPACES_SECRET_KEY` | Spaces API Secret Key | DigitalOcean → API → Spaces Keys |
| `SPACES_CDN_URL` | CDN endpoint URL | Your Space settings (e.g., `https://bucket.nyc3.cdn.digitaloceanspaces.com`) |

**To enable Spaces:** Follow the [DigitalOcean Spaces Setup Guide](./DIGITALOCEAN-SPACES-SETUP.md).

---

## 🏭 Production Environment Variables (DigitalOcean)

When deploying to DigitalOcean App Platform, set these in the dashboard:

### Required:
```env
NODE_ENV=production
PORT=8080
SESSION_SECRET=<strong_random_secret_64+_characters>
FRONTEND_URL=${APP_URL}
```

### Optional - Google OAuth (Currently Disabled):
```env
GOOGLE_CLIENT_ID=<your_production_google_client_id>
GOOGLE_CLIENT_SECRET=<your_production_google_client_secret>
GOOGLE_CALLBACK_URL=${APP_URL}/api/auth/google/callback
```

### Optional - DigitalOcean Spaces (Highly Recommended):
```env
SPACES_ENDPOINT=nyc3.digitaloceanspaces.com
SPACES_REGION=nyc3
SPACES_BUCKET=skylit-photography
SPACES_ACCESS_KEY=<your_spaces_access_key>
SPACES_SECRET_KEY=<your_spaces_secret_key>
SPACES_CDN_URL=https://skylit-photography.nyc3.cdn.digitaloceanspaces.com
```

**Note**: 
- `${APP_URL}` is automatically provided by DigitalOcean.
- Mark `SESSION_SECRET`, `SPACES_ACCESS_KEY`, and `SPACES_SECRET_KEY` as **Secret** type in the dashboard.

---

## 🛡️ Security Best Practices

### ✅ DO:
- ✅ Generate a **strong, random** `SESSION_SECRET` (minimum 64 characters)
- ✅ Use **different secrets** for development and production
- ✅ Keep `.env` file in `.gitignore` (already configured)
- ✅ Store production secrets in DigitalOcean's encrypted environment variables
- ✅ Rotate secrets periodically

### ❌ DON'T:
- ❌ **NEVER** commit `.env` to Git
- ❌ **NEVER** share your `.env` file
- ❌ **NEVER** use simple passwords like "secret123"
- ❌ **NEVER** reuse secrets across different projects

---

## 🔄 Generating a SESSION_SECRET

### Method 1: Using Node.js (Recommended)

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Output example:
```
a3f8d9c2b5e7f1a4c6d8e2f9b3a5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1
```

### Method 2: Using OpenSSL

```bash
openssl rand -hex 32
```

### Method 3: Online Generator

Use a secure password generator like [RandomKeygen](https://randomkeygen.com/) (use the "Fort Knox Passwords" section).

---

## 🌐 Environment-Specific URLs

### Development:
- Frontend: `http://localhost:3000` (Vite dev server)
- Backend API: `http://localhost:5000`
- Google Callback: `http://localhost:5000/api/auth/google/callback`

### Production (DigitalOcean):
- Frontend: `https://your-app-name.ondigitalocean.app`
- Backend API: `https://your-app-name.ondigitalocean.app` (same URL, backend serves frontend)
- Google Callback: `https://your-app-name.ondigitalocean.app/api/auth/google/callback`

---

## 🔍 Troubleshooting

### "Authentication failed" Error:
- Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` match your Google Cloud Console
- Verify the callback URL is correctly configured in both `.env` and Google Console

### "Session expired" Issues:
- Ensure `SESSION_SECRET` is set and the same across server restarts
- Check that cookies are enabled in your browser

### CORS Errors:
- Verify `FRONTEND_URL` matches your actual frontend URL
- In production, make sure the DigitalOcean app URL is correct

---

## 📚 Related Documentation

- [Google OAuth Setup Guide](./GOOGLE-OAUTH-SETUP.md)
- [Deployment Guide](./DEPLOYMENT-GUIDE.md)
- [Getting Started](./GETTING-STARTED.md)

---

**Remember**: Your `.env` file contains sensitive information. Keep it secure! 🔒

