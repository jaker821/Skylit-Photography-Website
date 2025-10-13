# 🔐 Password Hashing Migration Guide

## What Changed?

**Version 1.1.0** now includes **bcrypt password hashing** for secure password storage. Passwords are no longer stored as plain text!

---

## 🚨 Important: One-Time Migration Required

Since we upgraded from plain-text passwords to bcrypt hashing, you need to reset the users database **once** after deployment.

---

## 📋 Migration Steps for DigitalOcean

### Option 1: Via DigitalOcean Console (Recommended)

1. **Log into DigitalOcean**
   - Go to [cloud.digitalocean.com/apps](https://cloud.digitalocean.com/apps)
   - Select your app

2. **Access Console**
   - Click on **"Console"** tab
   - This opens a terminal to your running app

3. **Delete the old users.json file**
   ```bash
   rm -f /workspace/server/data/users.json
   ```

4. **Restart the app**
   - Go back to **Settings** → **"Force Rebuild & Deploy"**
   - Or click **"Actions"** → **"Restart"**

5. **The app will automatically create a new users.json with:**
   - Username: `admin`
   - Password: `admin123` (hashed with bcrypt)

### Option 2: Manual File Management (Alternative)

1. **Before deploying the new code:**
   - Log into your app
   - Go to Admin → Users tab
   - Note down any user accounts you want to keep

2. **Deploy the new code**
   - Push changes to GitHub
   - Wait for deployment

3. **After deployment:**
   - Delete `server/data/users.json` via console (see Option 1, step 3)
   - Restart the app
   - Log in with default credentials:
     - Username: `admin`
     - Password: `admin123`

4. **Re-invite users** (if any existed):
   - Users will need to register again
   - You'll approve them via Admin → Users

---

## 🔐 Default Admin Credentials (Post-Migration)

```
Username: admin
Password: admin123
```

⚠️ **IMPORTANT:** Change this password immediately after logging in!
- Go to **Profile** → **Change Password**
- Use a strong, unique password

---

## ✅ How to Verify It's Working

### 1. Check users.json
After restart, check `server/data/users.json`:

**Before (Plain Text):**
```json
{
  "users": [
    {
      "email": "admin",
      "password": "admin123",  ← Plain text (bad!)
      ...
    }
  ]
}
```

**After (Hashed):**
```json
{
  "users": [
    {
      "email": "admin",
      "password": "$2b$10$xyz...",  ← Hashed with bcrypt (good!)
      ...
    }
  ]
}
```

### 2. Test Login
- Go to your website
- Log in with: `admin` / `admin123`
- Should work successfully

### 3. Test Password Change
- Go to Profile
- Change your password
- Log out and log back in with new password
- Should work successfully

---

## 🆕 What's New in Password Security?

### Before v1.1.0:
- ❌ Passwords stored as plain text
- ❌ Anyone with file access could see passwords
- ❌ Insecure for production use

### After v1.1.0:
- ✅ Passwords hashed with bcrypt
- ✅ 10 salt rounds for strong encryption
- ✅ Industry-standard security
- ✅ Passwords unreadable even with file access

---

## 🔄 How It Works Now

### Registration:
```javascript
User enters: "mypassword123"
    ↓
bcrypt.hash("mypassword123", 10)
    ↓
Stored: "$2b$10$xyz..." (hashed)
```

### Login:
```javascript
User enters: "mypassword123"
    ↓
bcrypt.compare("mypassword123", stored_hash)
    ↓
Match? → Login successful!
```

---

## 🆘 Troubleshooting

### Problem: Can't log in with admin/admin123

**Possible causes:**
1. Old users.json still exists (not regenerated)
2. App not restarted after file deletion

**Solution:**
```bash
# In DigitalOcean Console:
rm -f /workspace/server/data/users.json
# Then restart the app from dashboard
```

### Problem: "Invalid credentials" error

**Check:**
1. Username is `admin` (not `admin@skylit.com`)
2. Password is `admin123` (case-sensitive)
3. users.json has been regenerated
4. App has been restarted

### Problem: Lost access to admin account

**Solution:**
```bash
# Delete users.json and restart to reset to defaults
rm -f /workspace/server/data/users.json
# Then restart app from dashboard
```

---

## 📊 Why This Matters

### Security Comparison:

| Aspect | Plain Text (Old) | Bcrypt (New) |
|--------|-----------------|--------------|
| **Visibility** | Readable by anyone | Encrypted hash |
| **Reversible** | Yes (major risk!) | No |
| **Industry Standard** | ❌ No | ✅ Yes |
| **Production Ready** | ❌ No | ✅ Yes |
| **OWASP Compliant** | ❌ No | ✅ Yes |

---

## 🎯 After Migration Checklist

- [ ] Deleted old users.json file
- [ ] Restarted the app
- [ ] Verified new users.json has hashed passwords
- [ ] Logged in with admin/admin123
- [ ] Changed admin password immediately
- [ ] Tested registration with new account
- [ ] Tested password change functionality
- [ ] Confirmed login works with new password

---

## 💡 Best Practices Going Forward

1. **Change default password immediately** after deployment
2. **Use strong passwords** (minimum 12 characters, mix of types)
3. **Don't share admin credentials** - create separate admin accounts if needed
4. **Regular password rotation** - change passwords periodically
5. **Monitor admin access** - check who has admin privileges

---

## 🚀 Future Improvements

In future versions, we plan to add:
- Two-factor authentication (2FA)
- Password reset via email
- Account lockout after failed attempts
- Password complexity requirements
- Session timeout configuration

---

## ✅ Summary

**What you need to do:**
1. Push the new code to GitHub
2. Let DigitalOcean deploy it
3. Delete `server/data/users.json` via console
4. Restart the app
5. Log in with `admin` / `admin123`
6. Change your password immediately

**Result:**
- 🔒 Secure password storage
- 🛡️ Industry-standard encryption
- ✅ Production-ready security

---

**Questions?** Check the troubleshooting section or review server logs for any errors.

