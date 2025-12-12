# Session System Consolidation Plan

## Workflow Summary

### Status Flow
1. **request** → User requests session (or admin creates from social media)
2. **quoted** → Admin creates quote and sends to client
3. **booked** → Admin books the session (from request or quote)
4. **paid** → Admin marks session as paid (allows invoicing)
5. **invoiced** → Admin creates invoice for the session

### Key Points
- Sessions can be created as "request" (user-initiated) or "quoted" (admin-initiated)
- Only "booked" or "paid" sessions can be invoiced
- Invoices can be standalone (no session_id) or linked to a session
- Paid status is tracked separately (paid, paid_at, paid_amount)

## Database Changes

### Sessions Table
- Status values: `request`, `quoted`, `booked`, `paid`, `invoiced`
- Added: `paid` (boolean), `paid_at` (timestamp), `paid_amount` (decimal)

### Migration Steps
1. Run `migrations/consolidate_bookings_to_sessions.sql`
2. This migrates existing bookings → sessions
3. Updates reviews to reference session_id
4. Keeps bookings table for rollback (can drop later)

## API Endpoints

### Sessions
- `POST /api/sessions/request` - Create session request (users & admin)
- `POST /api/sessions/quote` - Create quote (admin only)
- `POST /api/sessions/booking` - Create booking directly (admin only)
- `GET /api/sessions?status=request` - Get sessions by status
- `PUT /api/sessions/:id/book` - Convert request/quote to booked
- `PUT /api/sessions/:id/paid` - Mark session as paid
- `POST /api/sessions/:id/invoice` - Invoice a session

### Invoices
- `POST /api/invoices/standalone` - Create invoice without session
- `GET /api/invoices` - Get all invoices
- `PUT /api/invoices/:id` - Update invoice (mark as paid, etc.)

## Frontend Changes

### AdminDashboard Tabs
**Old**: Overview, Sessions, Portfolio, Calendar, Expenses, Invoice, QuickBooks, Pricing, Users, Settings
**New**: Overview, Portfolio, Sessions, Invoicing, Expenses, Pricing, Users, Settings

### New Tabs Structure
1. **Overview** - Financial overview, upcoming sessions
2. **Portfolio** - Portfolio management (unchanged)
3. **Sessions** - All session management with status filtering
   - Shows: request, quoted, booked, paid, invoiced
   - Actions: Book, Mark Paid, Invoice, Email
4. **Invoicing** - Invoice management
   - Standalone invoices
   - Session-linked invoices
   - Payment tracking
5. **Expenses** - Expense tracking (unchanged)
6. **Pricing** - Pricing packages (unchanged)
7. **Users** - User management (unchanged)
8. **Settings** - Settings (unchanged)

### UserDashboard
- Change booking form to create session request
- Update to use `/api/sessions/request` endpoint
- Show user's sessions with status

## Implementation Status

✅ Database schema updated
✅ Migration script created
✅ Backend API endpoints updated
⏳ Frontend AdminDashboard refactoring
⏳ Frontend UserDashboard update
⏳ Reviews system update

