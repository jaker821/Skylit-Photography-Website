# 📸 Dual Storage & Email-Based Photo Access System
## Implementation Guide

---

## ✅ PHASE 1: COMPLETED - Dual Storage with Compression

### What's Been Implemented:

1. **Sharp Library Installed** ✅
   - Industry-standard image processing
   - Fast compression and resizing

2. **Memory Storage for Processing** ✅
   - Files stored in memory for processing
   - Enables compression before uploading

3. **Helper Function: `uploadBufferToSpaces`** ✅
   - Uploads any buffer to any folder in Spaces
   - Returns CDN URL
   - Handles errors properly

4. **Dual Storage Upload Endpoint** ✅
   - Uploads ORIGINAL to `originals/` folder
   - Creates COMPRESSED version (85% quality, 1920px max)
   - Uploads compressed to `portfolio/` folder
   - Logs compression ratio (e.g., 9MB → 0.25MB)
   - Stores both URLs in database

### Database Schema Update:

Photos now store:
```json
{
  "id": "unique-id",
  "displayUrl": "https://cdn.../portfolio/123.jpg",  // Compressed (web)
  "downloadUrl": "https://cdn.../originals/123.jpg", // Original (download)
  "displayKey": "portfolio/123.jpg",                 // S3 key compressed
  "downloadKey": "originals/123.jpg",                // S3 key original
  "originalName": "wedding-shot.jpg",
  "originalSize": 9437184,                           // Bytes
  "compressedSize": 262144,                          // Bytes
  "uploadedAt": "2025-01-15T10:30:00.000Z",
  "hasHighRes": true                                  // Can be deleted later
}
```

---

## 🚧 PHASE 2: IN PROGRESS - Email-Based Access Control

### What's Being Added:

#### 1. Shoot Schema Update

Add to each shoot:
```json
{
  "id": 1,
  "title": "Sarah's Wedding",
  "category": "Weddings",
  "authorizedEmails": [
    "sarah@email.com",
    "john@email.com",
    "mom@email.com"
  ],
  "downloadStats": {
    "totalDownloads": 15,
    "downloadHistory": [
      {
        "email": "sarah@email.com",
        "photoId": "123",
        "downloadedAt": "2025-01-15T10:30:00.000Z"
      }
    ]
  },
  "highResDeletedAt": null,  // Timestamp when originals deleted
  "photos": [...]
}
```

#### 2. Email Management API Endpoints

**Add/Remove Authorized Emails:**
```javascript
// Add email(s) to shoot
POST /api/portfolio/shoots/:id/authorized-emails
Body: { emails: ["client@email.com"] }

// Remove email from shoot
DELETE /api/portfolio/shoots/:id/authorized-emails/:email

// Get authorized emails for shoot
GET /api/portfolio/shoots/:id/authorized-emails
```

#### 3. Download Endpoint with Permission Check

```javascript
// Download high-res photo (authenticated users only)
GET /api/photos/:photoId/download

// Check permissions:
// 1. User must be logged in
// 2. User email must be in shoot's authorizedEmails
// 3. Photo must have hasHighRes: true
// 4. If authorized, redirect to downloadUrl
```

#### 4. Admin: Delete High-Res Versions

```javascript
// Delete original versions for a shoot (save space)
DELETE /api/portfolio/shoots/:id/originals

// What happens:
// 1. Deletes all files in originals/ folder for this shoot
// 2. Sets hasHighRes: false for all photos
// 3. Records highResDeletedAt timestamp
// 4. Keeps compressed versions (displayUrl)
// 5. Shows warning before deleting
```

---

## 📊 Storage Structure

### DigitalOcean Spaces Organization:

```
your-bucket/
├── portfolio/                  ← Compressed (always kept)
│   ├── 1736941234567-123.jpg (250KB)
│   ├── 1736941235678-456.jpg (280KB)
│   └── 1736941236789-789.jpg (230KB)
│
└── originals/                  ← Full quality (can be deleted)
    ├── 1736941234567-123.jpg (9.2MB)
    ├── 1736941235678-456.jpg (8.5MB)
    └── 1736941236789-789.jpg (10.1MB)
```

### Typical Storage Usage:

**100 Photos Example:**
- Compressed: 100 × 250KB = 25MB (permanent)
- Originals: 100 × 9MB = 900MB (can delete after 30 days)
- **Total while originals kept:** 925MB
- **After deleting originals:** 25MB

**Cost Impact:**
- All within $5/month plan (250GB included)
- Can store 1,000 shoots before hitting limit!

---

## 🎨 User Experience Flow

### Admin Uploads Photos:

1. Admin selects photos (any size/quality)
2. Server processes each photo:
   - Uploads original (9MB) → `originals/`
   - Compresses to 250KB
   - Uploads compressed → `portfolio/`
3. Both URLs stored in database
4. Admin sees compression stats

### Admin Manages Access:

1. Admin opens shoot settings
2. Adds client emails (one or multiple)
3. Clients can now log in and download
4. Admin can remove access anytime

### Client Downloads:

1. Client logs in with their email
2. Sees only shoots they have access to
3. Clicks "Download High-Res" button
4. Gets original 9MB file
5. Download is tracked

### Admin Cleans Up Storage:

1. After 30 days (or whenever)
2. Admin clicks "Delete High-Res Versions"
3. System warns: "This will delete originals, keep compressed"
4. Confirms deletion
5. Space freed up, compressed versions remain
6. Clients see "High-res no longer available"

---

## 🔐 Permission System

### Permission Checks:

```javascript
function canDownloadPhoto(userEmail, shoot) {
  // Admin can always download
  if (userRole === 'admin') return true;
  
  // Check if email is authorized
  if (!shoot.authorizedEmails.includes(userEmail)) {
    return false;
  }
  
  // Check if high-res still exists
  if (!shoot.photos.some(p => p.hasHighRes)) {
    return false;
  }
  
  return true;
}
```

### Access Levels:

1. **Public (Portfolio Page)**
   - Everyone sees compressed images
   - Fast loading experience
   - No download button

2. **Logged-In Clients**
   - See compressed images
   - IF authorized: Download button appears
   - Downloads original quality

3. **Admin**
   - Sees everything
   - Can download both versions
   - Can manage access
   - Can delete originals

---

## 📱 UI Components Needed

### Admin Dashboard - Shoot Settings:

```
┌─────────────────────────────────────────────────┐
│  Shoot: Sarah's Wedding                          │
├─────────────────────────────────────────────────┤
│                                                  │
│  📧 Authorized Emails:                           │
│  ┌─────────────────────────────────────────┐   │
│  │ sarah@email.com            [Remove]     │   │
│  │ john@email.com             [Remove]     │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│  [+ Add Email]                                   │
│                                                  │
│  💾 Storage Info:                                │
│  • 45 photos                                     │
│  • Compressed: 11.2 MB                           │
│  • Originals: 405 MB                             │
│  • Uploaded: Dec 25, 2024                        │
│                                                  │
│  [🗑️ Delete High-Res Versions]                  │
│  (Frees up 405 MB, keeps compressed)            │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Client View - Download Button:

```
┌─────────────────────────────────────────────────┐
│  [Compressed Photo Display]                      │
│                                                  │
│  Sarah's Wedding - December 2024                 │
│                                                  │
│  [📥 Download Full Quality (9.2 MB)]            │
│                                                  │
└─────────────────────────────────────────────────┘
```

### After Originals Deleted:

```
┌─────────────────────────────────────────────────┐
│  [Compressed Photo Display]                      │
│                                                  │
│  Sarah's Wedding - December 2024                 │
│                                                  │
│  ℹ️ High-resolution versions no longer available │
│  (Deleted on Jan 25, 2025 to save storage)      │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## 🎯 Next Steps

### Immediate (This Session):

- [x] Install Sharp
- [x] Create dual storage upload
- [ ] Add email management endpoints
- [ ] Add download endpoint
- [ ] Add delete originals endpoint
- [ ] Update frontend for new schema
- [ ] Add download buttons
- [ ] Add email management UI
- [ ] Test complete workflow

### Future Enhancements:

- [ ] Batch download (download all photos in shoot as ZIP)
- [ ] Email notifications when photos ready
- [ ] Automatic cleanup (delete originals after 30 days)
- [ ] Download expiry dates
- [ ] Watermark for unauthorized users
- [ ] Client portal (dedicated page for clients)
- [ ] Download analytics dashboard

---

## 🧪 Testing Checklist

### Test Upload:
- [ ] Upload 1 photo (9MB)
- [ ] Check logs for compression ratio
- [ ] Verify both versions in Spaces
- [ ] Check database has both URLs
- [ ] Verify compressed displays on portfolio

### Test Email Access:
- [ ] Add email to shoot
- [ ] Log in with that email
- [ ] Verify download button appears
- [ ] Download works
- [ ] Remove email, button disappears

### Test Delete Originals:
- [ ] Delete originals for a shoot
- [ ] Verify files deleted from Spaces
- [ ] Verify hasHighRes = false
- [ ] Verify compressed still displays
- [ ] Verify download button shows message

---

## 📝 Migration Plan for Existing Photos

If you have photos already uploaded (old schema):

```javascript
// Migration script (I'll create this)
// Reads all existing photos
// For each photo without displayUrl:
//   - Current URL becomes displayUrl
//   - downloadUrl = null (no original available)
//   - hasHighRes = false
// Saves updated schema
```

---

**Status:** Phase 1 Complete, Phase 2 in progress!

Let me know when you're ready to continue and I'll implement the email management and download features!

