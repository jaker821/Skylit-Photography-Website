# Deployment Checklist - Skylit Photography v2.0.0

## Pre-Deployment Checklist ✅

### Environment Variables
- [ ] `SUPABASE_URL` - Set to your Supabase project URL
- [ ] `SUPABASE_ANON_KEY` - Set to your Supabase anonymous key
- [ ] `DB_HOST` - Set to your Supabase database host
- [ ] `DB_PASSWORD` - Set to your Supabase database password
- [ ] `SPACES_ENDPOINT` - Set to your DigitalOcean Spaces endpoint
- [ ] `SPACES_BUCKET` - Set to your Spaces bucket name
- [ ] `SPACES_ACCESS_KEY` - Set to your Spaces access key
- [ ] `SPACES_SECRET_KEY` - Set to your Spaces secret key
- [ ] `SPACES_CDN_URL` - Set to your Spaces CDN URL

### Database Setup
- [ ] Supabase project created and active
- [ ] Database tables created (9 tables total)
- [ ] Admin user created (admin@skylit.com / admin123)
- [ ] Pricing categories populated (18 categories)

### Code Verification
- [ ] Server starts successfully (`npm start`)
- [ ] Admin login works
- [ ] Photo uploads work
- [ ] Database operations work
- [ ] No console errors

## Deployment Steps

### 1. GitHub Deployment (Automatic)
```bash
# Add all changes
git add .

# Commit with version message
git commit -m "v2.0.0: Supabase integration with complete data persistence"

# Push to main branch (DigitalOcean auto-deploys)
git push origin main
```

### 2. DigitalOcean Auto-Deployment
- ✅ **Automatic** - DigitalOcean detects GitHub push
- ✅ **Pulls Code** - Gets latest version from GitHub
- ✅ **Installs Dependencies** - Runs `npm install`
- ✅ **Builds Frontend** - Runs `npm run build`
- ✅ **Restarts App** - Updates live application
- ✅ **Zero Downtime** - Seamless deployment

### 3. Post-Deployment Verification
- [ ] Website loads correctly
- [ ] Admin login works (admin@skylit.com / admin123)
- [ ] Can upload photos
- [ ] Can create shoots
- [ ] Can manage users
- [ ] Database persists through deployment

## Rollback Plan (If Needed)
1. Revert to previous commit
2. Restore old environment variables
3. Redeploy previous version

## Success Criteria
- ✅ Zero data loss during deployment
- ✅ Admin credentials persist
- ✅ All functionality works
- ✅ Photos load from DigitalOcean Spaces
- ✅ Database operations work correctly

## Support
- **Email:** admin@yourdomain.com
- **Location:** Raleigh/Durham, NC
