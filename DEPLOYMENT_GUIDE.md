# Deployment Guide - Skylit Photography

## Database Setup for Production

### Problem Solved
The website was experiencing issues because:
1. A migration script was running on every deployment, potentially resetting user data
2. Missing database schema columns were causing API errors
3. Database wasn't persisting between deployments

### Solution Implemented

1. **Fixed Database Schema**: Added missing `user_id` column to the `bookings` table
2. **Disabled Auto-Migration**: Commented out the migration script that was running on server startup
3. **Created Production Database**: Generated a clean database file with proper schema and default data

### Files Created/Modified

#### New Files:
- `server/create-production-db.js` - Script to create clean production database
- `server/photography-production.db` - Clean database file ready for deployment

#### Modified Files:
- `server/database.js` - Added user_id column and migration logic
- `server/server.js` - Disabled automatic migration on startup

### Deployment Steps

1. **Upload the database file to your Digital Ocean server**:
   ```bash
   # Copy the production database file to your server
   scp server/photography-production.db user@your-server:/path/to/your/app/server/data/photography.db
   ```

2. **Ensure the database directory exists on your server**:
   ```bash
   mkdir -p /path/to/your/app/server/data
   ```

3. **Deploy your code** (the migration script is now disabled, so it won't reset the database)

4. **Set environment variables** (optional, for custom admin credentials):
   ```bash
   export ADMIN_EMAIL="your-admin@email.com"
   export ADMIN_PASSWORD="your-secure-password"
   ```

### Database Contents

The production database includes:
- ✅ Proper schema with all required columns (including user_id)
- ✅ Default admin account:
  - Email: `admin@skylit.com`
  - Password: `admin123`
  - **⚠️ IMPORTANT: Change this password after first login!**
- ✅ Default pricing categories (Weddings, Portraits, Family, etc.)

### Verification

After deployment, verify:
1. Portfolio page loads without dark screen
2. Admin dashboard works correctly
3. User accounts persist between deployments
4. No migration messages in server logs

### Backup Strategy

The database file is stored at: `server/data/photography.db`

Make regular backups of this file to prevent data loss:
```bash
cp server/data/photography.db server/data/photography-backup-$(date +%Y%m%d).db
```

### Rollback Plan

If issues occur:
1. Restore the backup database file
2. Re-enable migration in server.js if needed
3. Check server logs for specific errors

---

**Note**: The migration script has been disabled to prevent database resets. If you need to migrate data in the future, you can manually run the migration script or re-enable it temporarily.
