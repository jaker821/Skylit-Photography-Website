# 🗄️ Database Migration Plan

## Problem
Current JSON file storage gets reset on every deployment, causing:
- ❌ User accounts and passwords lost
- ❌ Photo database reset
- ❌ Settings revert to defaults
- ❌ No data persistence between deployments

## Solution: PostgreSQL Database

### Why PostgreSQL?
- ✅ **Reliable** - ACID compliant, crash recovery
- ✅ **Scalable** - Handles growth from hundreds to millions of records
- ✅ **DigitalOcean Managed** - Automated backups, monitoring, scaling
- ✅ **Node.js Support** - Excellent libraries (pg, sequelize)
- ✅ **JSON Support** - Can store complex data structures
- ✅ **Free Tier** - DigitalOcean offers managed PostgreSQL

---

## Database Schema Design

### 1. Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Shoots Table
```sql
CREATE TABLE shoots (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  date DATE,
  authorized_emails TEXT[], -- Array of email strings
  download_stats JSONB, -- { totalDownloads: number, downloads: [...] }
  high_res_deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Photos Table
```sql
CREATE TABLE photos (
  id SERIAL PRIMARY KEY,
  shoot_id INTEGER REFERENCES shoots(id) ON DELETE CASCADE,
  original_name VARCHAR(255),
  filename VARCHAR(255),
  display_url VARCHAR(500), -- Compressed version URL
  download_url VARCHAR(500), -- High-res version URL
  display_key VARCHAR(500), -- Spaces key for compressed
  download_key VARCHAR(500), -- Spaces key for original
  original_size INTEGER, -- Size in bytes
  compressed_size INTEGER, -- Size in bytes
  has_high_res BOOLEAN DEFAULT true,
  uploaded_at TIMESTAMP DEFAULT NOW()
);
```

### 4. Bookings Table
```sql
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  session_type VARCHAR(100),
  date DATE,
  time TIME,
  location VARCHAR(255),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 5. Invoices Table
```sql
CREATE TABLE invoices (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER REFERENCES bookings(id),
  amount DECIMAL(10,2),
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 6. Expenses Table
```sql
CREATE TABLE expenses (
  id SERIAL PRIMARY KEY,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category VARCHAR(100),
  date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 7. Pricing Table (Categories, Packages, Add-ons)
```sql
CREATE TABLE pricing_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE pricing_packages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE pricing_addons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Migration Steps

### Phase 1: Setup Database
1. **Create DigitalOcean Managed PostgreSQL Database**
   - Go to DigitalOcean → Databases → Create Database
   - Choose PostgreSQL
   - Select same region as your app
   - Choose smallest plan (1GB RAM, 1 CPU, 10GB storage)
   - Set database name: `skylit_photography`

2. **Get Connection Details**
   - Host: `db-postgresql-xxx-xxx.ondigitalocean.com`
   - Port: `25060`
   - Database: `skylit_photography`
   - Username: `doadmin`
   - Password: (generated)

3. **Add Environment Variables**
   ```bash
   DATABASE_URL=postgresql://doadmin:password@host:port/database?sslmode=require
   DB_HOST=db-postgresql-xxx-xxx.ondigitalocean.com
   DB_PORT=25060
   DB_NAME=skylit_photography
   DB_USER=doadmin
   DB_PASSWORD=your_generated_password
   ```

### Phase 2: Install Dependencies
```bash
npm install pg sequelize sequelize-cli
```

### Phase 3: Create Database Models
- User model with authentication
- Shoot model with photos relationship
- Photo model with Spaces URLs
- Booking, Invoice, Expense models
- Pricing models

### Phase 4: Update Server Code
- Replace JSON file reads with database queries
- Update authentication to use database
- Update photo upload to save to database
- Update all API endpoints

### Phase 5: Data Migration
- Export existing JSON data
- Import into PostgreSQL
- Verify data integrity
- Test all functionality

### Phase 6: Deploy & Test
- Deploy with database connection
- Test user registration/login persistence
- Test photo upload persistence
- Verify data survives deployments

---

## Benefits After Migration

### Data Persistence
- ✅ User accounts survive deployments
- ✅ Photos database persists
- ✅ Settings and configurations saved
- ✅ No more data loss on redeploy

### Performance
- ✅ Faster queries with indexes
- ✅ Better concurrent user support
- ✅ Optimized photo metadata lookups
- ✅ Efficient user authentication

### Scalability
- ✅ Handle thousands of users
- ✅ Store millions of photos
- ✅ Database backups and recovery
- ✅ Horizontal scaling options

### Features
- ✅ Advanced user management
- ✅ Better photo organization
- ✅ Detailed analytics and reporting
- ✅ Search and filtering capabilities

---

## Cost Estimate

### DigitalOcean Managed PostgreSQL
- **Basic Plan**: $15/month (1GB RAM, 1 CPU, 10GB storage)
- **Standard Plan**: $30/month (2GB RAM, 1 CPU, 25GB storage)
- **Professional Plan**: $60/month (4GB RAM, 2 CPU, 50GB storage)

**Recommendation**: Start with Basic ($15/month) and scale up as needed.

---

## Timeline

### Week 1: Database Setup
- [ ] Create DigitalOcean database
- [ ] Install dependencies
- [ ] Create database schema
- [ ] Set up models

### Week 2: Code Migration
- [ ] Update authentication system
- [ ] Update photo upload system
- [ ] Update all API endpoints
- [ ] Test locally

### Week 3: Data Migration & Deploy
- [ ] Migrate existing data
- [ ] Deploy to production
- [ ] Test persistence
- [ ] Monitor performance

---

## Risk Mitigation

### Backup Strategy
- ✅ DigitalOcean automated daily backups
- ✅ Manual backup before migration
- ✅ Keep JSON files as fallback
- ✅ Test restore procedures

### Rollback Plan
- ✅ Deploy previous version if issues
- ✅ Revert to JSON files if needed
- ✅ Database connection failure handling
- ✅ Graceful error messages

### Testing Strategy
- ✅ Local development with database
- ✅ Staging environment testing
- ✅ User acceptance testing
- ✅ Performance testing

---

## Next Steps

1. **Create DigitalOcean Database** (30 minutes)
2. **Install Dependencies** (15 minutes)
3. **Create Database Schema** (1 hour)
4. **Update Authentication** (2 hours)
5. **Update Photo System** (3 hours)
6. **Test & Deploy** (2 hours)

**Total Time**: ~8-10 hours over 2-3 days

---

## Questions to Consider

1. **Database Size**: How many photos do you expect? (affects storage plan)
2. **User Growth**: How many users? (affects RAM/CPU plan)
3. **Backup Frequency**: Daily automated backups sufficient?
4. **Migration Timing**: When is best time to migrate? (low traffic period)
5. **Downtime**: Acceptable downtime for migration?

---

## Recommendation

**Start with DigitalOcean Managed PostgreSQL Basic Plan**:
- Cost: $15/month
- Storage: 10GB (enough for thousands of photos metadata)
- RAM: 1GB (sufficient for current needs)
- Automatic backups and monitoring
- Easy scaling when needed

This will solve your persistence issues and provide a solid foundation for growth.
