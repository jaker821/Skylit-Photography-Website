# Bookings vs Sessions Architecture

## Current Situation

You currently have **TWO separate systems** tracking similar data:

### 1. **Bookings Table** (Existing System)
- **Purpose**: General session management for clients and admin
- **Used by**: 
  - UserDashboard (clients booking sessions)
  - AdminDashboard (general session management)
  - Reviews system (references booking_id)
  - Calendar system
- **Status values**: `pending`, `Booked`, `Invoiced` (inconsistent casing)
- **Columns**: client_name, client_email, user_id, session_type, date, time, location, notes, status, package_id, quote_amount, invoice_id
- **API endpoints**: `/api/bookings/*`

### 2. **Sessions Table** (New QuickBooks System)
- **Purpose**: Financial tracking with quote-to-invoice workflow
- **Used by**: 
  - QuickBooks component only
- **Status values**: `quoted`, `booked`, `invoiced` (consistent, workflow-based)
- **Columns**: Same as bookings + invoice_amount, add_ons, quoted_at, booked_at, invoiced_at
- **API endpoints**: `/api/sessions/*`

## The Problem

1. **Data Duplication**: Two tables tracking essentially the same information
2. **Inconsistency**: Status values differ between tables
3. **Confusion**: Admin has to manage both systems
4. **Maintenance**: Changes need to be made in two places

## Recommended Solutions

### Option 1: Use Sessions Table Only (Recommended)
**Consolidate everything into the `sessions` table**

**Pros:**
- Single source of truth
- Better financial tracking (quoted_at, booked_at, invoiced_at timestamps)
- Consistent status workflow
- More features (add_ons, invoice_amount tracking)

**Cons:**
- Requires migration of existing bookings data
- Need to update all frontend code to use sessions API
- Need to update reviews to reference session_id instead of booking_id

**Migration Steps:**
1. Migrate all bookings data to sessions table
2. Update reviews table to use session_id
3. Update all API endpoints to use sessions
4. Update frontend components
5. Deprecate bookings table

### Option 2: Keep Both, Sync Them
**Use bookings for general management, sessions for financial tracking**

**Pros:**
- Minimal changes to existing code
- Bookings can continue as-is
- QuickBooks uses sessions for financial features

**Cons:**
- Still have duplication
- Need sync logic to keep them in sync
- More complex to maintain

### Option 3: Use Bookings Only, Enhance It
**Add missing columns to bookings table and use it everywhere**

**Pros:**
- No new table needed
- All existing code continues to work
- Reviews already reference bookings

**Cons:**
- Bookings table wasn't designed for financial workflow
- Would need to add: invoice_amount, add_ons, quoted_at, booked_at, invoiced_at
- Status values are inconsistent

## My Recommendation

**Option 1** - Consolidate into `sessions` table because:
1. The sessions table is better designed for the financial workflow
2. It has proper timestamps for each status change
3. It has better structure for add_ons and financial tracking
4. The QuickBooks system you requested needs this structure

However, this requires a migration. Would you like me to:
1. Create a migration script to move bookings → sessions?
2. Update all the code to use sessions instead of bookings?
3. Update reviews to reference sessions?

Or would you prefer to keep both systems and just document how they work together?

