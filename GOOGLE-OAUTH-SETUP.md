# Google OAuth Setup Guide

## 🔐 Google Cloud Console Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a Project" → "New Project"
3. Name it "Skylit Photography" (or your preferred name)
4. Click "Create"

### Step 2: Enable Google+ API

1. In the sidebar, go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click on it and click **Enable**

### Step 3: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. If prompted, configure the OAuth consent screen first:
   - Click **Configure Consent Screen**
   - Choose **External** (for public access)
   - Fill in the required information:
     - **App name**: Skylit Photography
     - **User support email**: Your email
     - **Developer contact**: Your email
   - Click **Save and Continue**
   - Skip "Scopes" for now (click **Save and Continue**)
   - Add test users if needed (or skip)
   - Click **Save and Continue**

4. Back to **Create OAuth client ID**:
   - **Application type**: Web application
   - **Name**: Skylit Photography Web Client
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (for development)
     - Add your production URL later (e.g., `https://yourdomain.com`)
   - **Authorized redirect URIs**:
     - `http://localhost:5000/api/auth/google/callback` (for development)
     - Add production callback later (e.g., `https://yourdomain.com/api/auth/google/callback`)
   - Click **Create**

5. **IMPORTANT**: Copy your **Client ID** and **Client Secret** - you'll need these!

### Step 4: Configure OAuth Consent Screen

1. Go to **OAuth consent screen** in the sidebar
2. Under "App information":
   - Upload an app logo (optional but recommended)
   - Add app domain if you have one
3. Under "Authorized domains":
   - Add your domain (for production later)
4. Fill in privacy policy and terms of service links (optional for testing)
5. Click **Save and Continue**

### Step 5: Add Environment Variables

Create a `.env` file in your project root:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Session Secret (generate a random string)
SESSION_SECRET=your_random_secret_string_here
```

**IMPORTANT**: Add `.env` to your `.gitignore` file to keep credentials secure!

---

## 📋 What Information Google Provides

When users sign in with Google, you'll receive:
- **Email address** (verified by Google)
- **Full name**
- **Profile picture**
- **Google ID** (unique identifier)

You'll still need to:
- Ask for **phone number** separately (Google doesn't provide this by default)
- Keep the **admin approval** system in place

---

## 🔒 Security Notes

1. **Never commit** your `.env` file to Git
2. **Use different credentials** for development vs production
3. **Regenerate secrets** if they're ever exposed
4. **Enable 2FA** on your Google Cloud account
5. **Review OAuth scopes** - only request what you need

---

## 🚀 Production Deployment

When deploying to production:

1. Update **Authorized JavaScript origins** in Google Console:
   - Add your production domain (e.g., `https://skylitphotography.com`)

2. Update **Authorized redirect URIs**:
   - Add production callback (e.g., `https://skylitphotography.com/api/auth/google/callback`)

3. Update your `.env` file:
   ```env
   GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback
   ```

4. Submit your app for **OAuth verification** if you exceed 100 users

---

## 📊 OAuth Consent Screen Publishing

**For Testing (< 100 users)**:
- No need to publish
- Add test users in Google Console
- Works immediately

**For Production (100+ users)**:
- Click "Publish App" in OAuth consent screen
- May require verification by Google
- Submit privacy policy and terms of service
- Usually takes 3-7 days for approval

---

## ✅ Testing Your Setup

1. Start your server: `npm run dev:all`
2. Go to registration page: `http://localhost:3000/register`
3. Click "Sign up with Google"
4. Select your Google account
5. Grant permissions
6. You should be redirected back to your app

If you see errors:
- Check that URLs match exactly in Google Console
- Verify your `.env` file has correct credentials
- Make sure Google+ API is enabled
- Check browser console for errors

---

## 🆘 Common Issues

**Error: "redirect_uri_mismatch"**
- Solution: Make sure the callback URL in your code exactly matches the one in Google Console

**Error: "access_denied"**
- Solution: User cancelled or app is not verified. For testing, add them as a test user.

**Error: "invalid_client"**
- Solution: Check your Client ID and Client Secret in `.env`

**Error: "unauthorized_client"**
- Solution: Enable Google+ API in Google Cloud Console

---

## 📞 Support

For Google OAuth issues:
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [OAuth Troubleshooting](https://developers.google.com/identity/protocols/oauth2/troubleshooting)

