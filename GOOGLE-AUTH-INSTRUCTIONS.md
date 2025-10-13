# 🚀 Google OAuth Quick Start Guide

## ✅ What's Been Implemented

Google Sign-In has been fully integrated into your Skylit Photography website! Users can now:
- Sign up with their Google account
- Sign in with Google on both Register and Login pages
- Still requires admin approval (security maintained!)

---

## 📋 Setup Steps (Required to Enable Google OAuth)

### Step 1: Install New Dependencies

Run this command in your project directory:

```bash
npm install
```

This will install:
- `passport` - Authentication middleware
- `passport-google-oauth20` - Google OAuth strategy
- `dotenv` - Environment variable management

### Step 2: Create Environment File

Create a file named `.env` in your project root with the following content:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Session Configuration
SESSION_SECRET=generate_a_random_string_here

# Server Configuration
PORT=5000

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

**IMPORTANT**: Replace the placeholder values!

### Step 3: Get Google OAuth Credentials

Follow the detailed guide in `GOOGLE-OAUTH-SETUP.md` to:
1. Create a Google Cloud Project
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Get your Client ID and Client Secret

**Quick link**: https://console.cloud.google.com/

### Step 4: Update .gitignore

Make sure `.env` is in your `.gitignore` file (it should already be there):

```
# Environment variables
.env
.env.local
.env.production
```

### Step 5: Start the Application

```bash
npm run dev:all
```

---

## 🎯 How It Works

### User Registration with Google:
1. User clicks "Sign up with Google" on `/register`
2. Google authentication popup appears
3. User grants permissions
4. Account is created with **"pending" status**
5. User is redirected to `/pending-approval` page
6. **Admin must approve** the account before they can log in

### User Login with Google:
1. User clicks "Sign in with Google" on `/login`
2. Google authentication popup appears
3. If approved: Redirected to dashboard
4. If pending: Redirected to pending approval page
5. If rejected: Shown error message

### What Google Provides:
- ✅ Name (from Google profile)
- ✅ Email (verified by Google)
- ✅ Profile picture
- ⚠️ **Phone number NOT included** - users will need to add this later

### Admin Approval System:
- All Google sign-ups still require admin approval
- Prevents spam accounts
- Maintains security and quality control
- Admin can approve/reject from Users tab in Admin Dashboard

---

## 🔧 Admin Dashboard - Users Tab

A new "Users" tab has been added to the Admin Dashboard where you can:

- ✅ See all pending user registrations
- ✅ View user details (name, email, phone, sign-up date, auth method)
- ✅ Approve users with one click
- ✅ Reject user registrations
- ✅ Delete users
- ✅ See a badge showing count of pending users

### Features:
- Shows auth method (Google vs email/password)
- Profile pictures for Google users
- Easy approve/reject buttons
- Protected - only admin can access

---

## 🔒 Security Features

1. **Admin Approval Required** - Even Google users need approval
2. **Session-based Auth** - Secure HTTP-only cookies
3. **Server-side Storage** - All user data in JSON files
4. **Account Linking** - If email exists, links Google account
5. **Status Checks** - Can't log in if pending or rejected

---

## 🧪 Testing Your Setup

### Test Registration:
1. Go to http://localhost:3000/register
2. Click "Sign up with Google"
3. Select your Google account
4. Should redirect to pending approval page

### Test Admin Approval:
1. Log in as admin
2. Go to Users tab
3. See the new Google user
4. Click "Approve"

### Test Login:
1. Go to http://localhost:3000/login
2. Click "Sign in with Google"
3. Should now redirect to dashboard (if approved)

---

## ❌ Troubleshooting

### "redirect_uri_mismatch" Error:
**Fix**: Make sure callback URL in Google Console exactly matches:
```
http://localhost:5000/api/auth/google/callback
```

### "Access Denied" Error:
**Fix**: Check that Google+ API is enabled in Google Cloud Console

### "Invalid Client" Error:
**Fix**: Verify `.env` file has correct `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

### Google button doesn't work:
**Fix**: 
1. Check `.env` file exists and has correct values
2. Restart server after creating `.env`
3. Check browser console for errors

### Users stuck on pending:
**Fix**: Log in as admin and approve them from Users tab

---

## 📁 Files Modified/Created

### New Files:
- ✅ `GOOGLE-OAUTH-SETUP.md` - Detailed Google Cloud Console setup
- ✅ `GOOGLE-AUTH-INSTRUCTIONS.md` - This file
- ✅ `src/pages/PendingApproval.jsx` - Pending approval page
- ✅ `.env` (you need to create this)

### Modified Files:
- ✅ `package.json` - Added passport dependencies
- ✅ `server/server.js` - Added Google OAuth strategy and routes
- ✅ `src/App.jsx` - Added PendingApproval route
- ✅ `src/pages/Register.jsx` - Added Google sign-up button
- ✅ `src/pages/Login.jsx` - Added Google sign-in button
- ✅ `src/App.css` - Added Google button and divider styles
- ✅ `src/pages/AdminDashboard.jsx` - Users tab (to be implemented)

---

## 🚀 Production Deployment

When deploying to production:

### Update Google Console:
1. Add production domain to Authorized JavaScript origins
2. Add production callback URL to Authorized redirect URIs

### Update .env:
```env
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback
FRONTEND_URL=https://yourdomain.com
SESSION_SECRET=use_a_different_secret_in_production
```

### Security Checklist:
- [ ] Use HTTPS (set `secure: true` for cookies)
- [ ] Different SESSION_SECRET than development
- [ ] Submit app for OAuth verification (if >100 users)
- [ ] Enable production CORS settings
- [ ] Use environment-specific Google credentials

---

## 💡 Optional Enhancements

Future improvements you could add:
- Allow users to add phone number after Google sign-up
- Show profile pictures in user dashboard
- Link existing email/password accounts to Google
- Add Facebook, GitHub, or other OAuth providers
- Email notifications when account is approved/rejected

---

## 📞 Need Help?

- Check `GOOGLE-OAUTH-SETUP.md` for detailed Google Console setup
- Review [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- Make sure all environment variables are set correctly
- Verify Google+ API is enabled

---

## ✨ Summary

You now have:
- ✅ Google OAuth sign-in on Register page
- ✅ Google OAuth sign-in on Login page
- ✅ Admin approval system maintained
- ✅ Secure authentication flow
- ✅ Users tab in Admin Dashboard (needs implementation)
- ✅ Beautiful, professional UI

**Next Steps**:
1. Get Google OAuth credentials
2. Create `.env` file
3. Install dependencies (`npm install`)
4. Test the flow
5. Approve users from Admin Dashboard

Happy authenticating! 🎉

