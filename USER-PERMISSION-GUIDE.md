# 🔐 User Permission System Guide

## Overview
This guide explains how to grant users access to download high-resolution photos from specific shoots.

## How It Works

### The System
1. **Admin uploads photos** → Both compressed (for viewing) and high-res (for download) versions are stored
2. **Admin assigns emails** → Grant specific users access to download high-res photos from a shoot
3. **User downloads** → Logged-in users with matching emails can download original quality photos
4. **Admin manages storage** → After delivery, admin can delete high-res versions to save space

---

## For Admins: Granting Access

### Step 1: Upload Photos
1. Go to **Admin Dashboard** → **Portfolio** tab
2. Select a shoot (or create a new one)
3. Click **"+ Upload Photos"**
4. Select images to upload
5. Watch the progress bar as photos are uploaded and compressed

### Step 2: Manage Access Permissions

Once photos are uploaded with high-res versions:

1. **In the shoot detail view**, you'll see a section: **"🔐 High-Res Download Access"**
2. Click **"Manage Access"** to expand the permission panel

#### Adding Users
1. Enter the user's email address (must match their login email)
2. Click **"+ Add Email"**
3. Confirmation: "Email added successfully!"

#### Removing Users
1. Find the email in the authorized users list
2. Click **"Remove"** next to their email
3. Confirm the removal

### Step 3: View Access List
- See all authorized emails for this shoot
- Count shows total users with access: `Authorized Users (X)`

---

## For Users: Downloading Photos

### Requirements
- Must have a registered account
- Must be logged in
- Email must be added by admin to the shoot's authorized list

### How to Download
1. Log in to your account
2. Go to your **User Dashboard**
3. Navigate to **"My Photos"** section
4. Find shoots you have access to
5. Click **"Download High-Res"** on any photo
6. Original quality photo will download

---

## Backend API Endpoints

### Add Authorized Email
```http
POST /api/portfolio/shoots/:id/authorized-emails
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Email added successfully",
  "authorizedEmails": ["user@example.com"]
}
```

### Remove Authorized Email
```http
DELETE /api/portfolio/shoots/:id/authorized-emails/:email
```

**Response:**
```json
{
  "message": "Email removed successfully",
  "authorizedEmails": []
}
```

### Get Authorized Emails
```http
GET /api/portfolio/shoots/:id/authorized-emails
```

**Response:**
```json
{
  "authorizedEmails": ["user@example.com", "client@example.com"]
}
```

### Check User Access
```http
GET /api/portfolio/shoots/:id/has-access
```

**Response:**
```json
{
  "hasAccess": true,
  "hasHighRes": true
}
```

### Download Photo
```http
GET /api/photos/:photoId/download
```

**Response:** Redirects to the high-res photo URL (or returns 403/410 if no access)

---

## Permission Rules

### Who Can Download?
✅ **Admin users** - Always have access to all high-res photos  
✅ **Authorized users** - Email matches the shoot's authorized list  
❌ **Other users** - Will see "No Access" or 403 error

### When High-Res is Deleted
- Admin can delete high-res versions to save storage
- Users will see "High-res no longer available" (410 error)
- Compressed versions remain for viewing

---

## Use Cases

### Wedding Photography
```
1. Admin uploads wedding photos
2. Admin adds: bride@example.com, groom@example.com
3. Couple logs in and downloads their photos
4. After 30 days, admin deletes high-res to free space
```

### Portrait Session
```
1. Admin uploads portrait session
2. Admin adds: client@example.com
3. Client downloads selected favorites
4. Admin keeps high-res for future prints
```

### Event Photography
```
1. Admin uploads event photos
2. Admin adds multiple attendee emails
3. Each attendee can download their photos
4. Admin bulk-deletes high-res after 60 days
```

---

## Storage Management

### View Storage Stats
Endpoint: `GET /api/portfolio/storage-stats` (Admin only)

Shows:
- Total photos vs photos with high-res
- Original size vs compressed size
- Compression ratio
- Space savings

### Delete High-Res for a Shoot
Endpoint: `DELETE /api/portfolio/shoots/:id/originals` (Admin only)

- Deletes all high-res versions for a shoot
- Keeps compressed versions for viewing
- Returns freed space in MB

---

## Security Features

1. **Authentication Required** - Users must be logged in
2. **Email Verification** - User's login email must match authorized list
3. **Per-Shoot Permissions** - Access is granted per shoot, not globally
4. **Admin Override** - Admins always have access
5. **Download Tracking** - System logs who downloaded what and when

---

## Troubleshooting

### User can't download
- ✓ Check user is logged in with correct email
- ✓ Verify email is in authorized list (case-sensitive)
- ✓ Confirm high-res versions haven't been deleted
- ✓ Check user account is approved (not pending)

### Email won't add
- ✓ Verify email format is valid
- ✓ Check for typos or extra spaces
- ✓ Ensure email isn't already in the list

### Download fails
- ✓ Verify photo has high-res version (`hasHighRes: true`)
- ✓ Check DigitalOcean Spaces connection
- ✓ Confirm CDN URL is accessible

---

## Future Enhancements

Potential features to add:
- Bulk email import from CSV
- Email notifications when access is granted
- Download limits per user
- Expiration dates for access
- Photo selection (let users choose which to download)
- ZIP download for multiple photos

---

## Technical Details

### Database Schema
```javascript
shoot: {
  id: string,
  title: string,
  photos: [...],
  authorizedEmails: string[],  // Array of email addresses
  downloadStats: {
    totalDownloads: number,
    downloads: [
      { email: string, photoId: string, timestamp: date }
    ]
  },
  highResDeletedAt: date | null
}
```

### Photo Schema
```javascript
photo: {
  id: string,
  displayUrl: string,      // Compressed version for web
  downloadUrl: string,     // High-res original
  displayKey: string,      // Spaces key for compressed
  downloadKey: string,     // Spaces key for original
  hasHighRes: boolean,     // True if original exists
  compressedSize: number,  // Size in bytes
  originalSize: number     // Size in bytes
}
```

---

## Summary

**For Admins:**
1. Upload photos → Auto-compressed + original stored
2. Add user emails in "Manage Access" section
3. Users can download high-res with their login email
4. Delete high-res later to optimize storage

**For Users:**
1. Create account with your email
2. Wait for admin to add your email to a shoot
3. Log in and download your high-res photos
4. Download multiple times if needed

**Security:**
- Email-based access control
- Per-shoot permissions
- Admin oversight
- Download tracking

