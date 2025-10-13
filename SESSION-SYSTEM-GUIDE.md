# 📅 Session/Booking System Guide

## 🎯 Overview

Complete booking and session management system for Skylit Photography with automatic invoice generation.

## 🔄 How It Works

### User Flow
1. **User contacts Alina** about a shoot OR **user books online**
2. **Session/Booking is created** in the system
3. **Alina manages the session** (confirms, updates details)
4. **After shoot is complete**, Alina creates an invoice from the session
5. **Invoice is linked** to the booking automatically

### Admin Flow
1. **Alina logs in** to admin dashboard
2. **Views all sessions** in Sessions tab
3. **Can manually add sessions** from contact form inquiries
4. **Marks session complete** after the shoot
5. **Creates invoice** directly from session
6. **Tracks payment** status

## 📋 Dashboard Tabs (In Order)

### 1. Overview
- Financial summary
- Revenue, expenses, profit
- Upcoming sessions calendar
- Recent activity

### 2. Sessions
- **View all bookings/sessions**
- Pending, Confirmed, Completed, Invoiced statuses
- **Manually add new sessions** (from contact inquiries)
- Edit session details
- Mark as complete
- **Create invoice from session**
- Delete sessions

### 3. Portfolio
- Create new shoots
- Upload photos to shoots
- Organize by category
- Delete photos/shoots

### 4. Expenses
- Track business expenses
- Categorize expenses
- View totals
- Add/edit/delete expenses

### 5. Invoices
- View all invoices
- **Auto-created from sessions**
- Edit invoice details
- Track payment status
- Send invoices to clients
- Delete invoices

## 💾 Data Structure

### Booking/Session
```json
{
  "id": 1,
  "userId": 2,
  "clientName": "Sarah Johnson",
  "clientEmail": "sarah@example.com",
  "sessionType": "Wedding",
  "date": "2025-11-20",
  "time": "2:00 PM",
  "location": "Pullen Park, Raleigh",
  "notes": "Outdoor ceremony, 100 guests",
  "status": "Pending|Confirmed|Completed|Invoiced",
  "createdAt": "2025-10-13T...",
  "invoiceId": 5  // Linked invoice (or null)
}
```

### Invoice
```json
{
  "id": 5,
  "invoiceNumber": "INV-0005",
  "clientName": "Sarah Johnson",
  "clientEmail": "sarah@example.com",
  "amount": 1200,
  "status": "Pending|Paid|Overdue",
  "date": "2025-11-21",
  "items": [
    { "description": "Wedding Photography Package", "amount": 1200 }
  ],
  "bookingId": 1,  // Linked booking
  "createdAt": "2025-11-21T..."
}
```

### Expense
```json
{
  "id": 3,
  "category": "Equipment",
  "description": "New Camera Lens",
  "amount": 1200,
  "date": "2025-10-10",
  "createdAt": "2025-10-10T..."
}
```

## 🔌 API Endpoints

### Bookings/Sessions
```
GET    /api/bookings              // Get all (admin sees all, users see own)
POST   /api/bookings              // Create booking (users & admin)
PUT    /api/bookings/:id          // Update booking (admin only)
DELETE /api/bookings/:id          // Delete booking (admin only)
```

### Invoices
```
GET    /api/invoices              // Get all invoices (admin only)
POST   /api/invoices              // Create invoice (admin only)
PUT    /api/invoices/:id          // Update invoice (admin only)
DELETE /api/invoices/:id          // Delete invoice (admin only)
```

### Expenses
```
GET    /api/expenses              // Get all expenses (admin only)
POST   /api/expenses              // Create expense (admin only)
PUT    /api/expenses/:id          // Update expense (admin only)
DELETE /api/expenses/:id          // Delete expense (admin only)
```

## 📊 Status Flow

### Booking Status Flow
1. **Pending** - Initial state when created
2. **Confirmed** - Admin confirms the booking
3. **Completed** - Shoot is finished
4. **Invoiced** - Invoice has been created (auto-set)

### Invoice Status Flow
1. **Pending** - Awaiting payment
2. **Paid** - Payment received
3. **Overdue** - Past due date

## 🎨 Features

### For Users
- ✅ Book sessions online
- ✅ View booking history
- ✅ See booking status
- ✅ Track upcoming sessions

### For Admin (Alina)
- ✅ **View all sessions** from all clients
- ✅ **Manually add sessions** (from contact form)
- ✅ **Update session details** (date, time, location)
- ✅ **Change session status**
- ✅ **Create invoice from session** (one click)
- ✅ **Auto-link invoice to booking**
- ✅ **Track which sessions are invoiced**
- ✅ **View financial overview**
- ✅ **Track expenses**
- ✅ **Calculate profit** (revenue - expenses)

## 🔗 Linking Sessions to Invoices

When admin creates an invoice from a session:

1. **Invoice created** with session details pre-filled
2. **Invoice ID** saved to the booking
3. **Booking status** changed to "Invoiced"
4. **Both are linked** - can view invoice from booking and vice versa

## 📝 Use Cases

### Use Case 1: User Books Online
```
1. User logs in
2. User fills out booking form
3. Booking created with status "Pending"
4. Admin sees it in Sessions tab
5. Admin confirms booking → status "Confirmed"
6. Shoot happens → status "Completed"
7. Admin creates invoice → status "Invoiced"
8. Client pays → invoice status "Paid"
```

### Use Case 2: Contact Form Inquiry
```
1. Someone contacts Alina via contact form
2. Alina logs into admin dashboard
3. Goes to Sessions tab → "Add Session"
4. Manually enters client details
5. Booking created with status "Pending"
6. ... rest of flow same as above
```

### Use Case 3: Create Invoice
```
1. Admin goes to Sessions tab
2. Finds completed session
3. Clicks "Create Invoice"
4. Invoice form pre-filled with:
   - Client name
   - Client email
   - Session type
   - Default amount (from pricing)
5. Admin can edit details
6. Saves invoice
7. Booking auto-updated with invoice ID
8. Booking status → "Invoiced"
```

## 💡 Smart Features

### Auto-Calculations
- **Total Revenue**: Sum of all paid invoices
- **Total Expenses**: Sum of all expenses
- **Net Profit**: Revenue - Expenses
- **Pending Revenue**: Sum of pending invoices

### Status Badges
- Color-coded for quick visual scanning
- **Pending**: Orange/Warning
- **Confirmed**: Blue/Info
- **Completed**: Green/Success
- **Invoiced**: Purple
- **Paid**: Green
- **Overdue**: Red/Error

### Smart Defaults
- **Date**: Today's date
- **Client info**: Pre-filled from user account
- **Invoice amount**: Based on session type and pricing

## 🎯 Admin Dashboard Features

### Sessions Tab
- **List View**: All sessions with filters
- **Status Filter**: Filter by Pending/Confirmed/Completed/Invoiced
- **Search**: Search by client name
- **Quick Actions**:
  - Edit session
  - Create invoice
  - Delete session
- **Add Session Button**: Manually add from contact inquiries

### Invoices Tab
- **List View**: All invoices
- **Status Filter**: Pending/Paid/Overdue
- **Linked Sessions**: See which session each invoice is for
- **Quick Actions**:
  - Edit invoice
  - Mark as paid
  - Send to client (future feature)
  - Delete invoice

### Overview Tab
- **Financial Cards**:
  - Total Revenue (YTD)
  - Total Expenses (YTD)
  - Pending Payments
  - Net Profit
- **Upcoming Sessions**: Next 5 sessions
- **Recent Invoices**: Last 5 invoices
- **Charts** (future): Revenue trends

## 📁 File Storage

All data in JSON files:
- `server/data/bookings.json` - All sessions/bookings
- `server/data/invoices.json` - All invoices
- `server/data/expenses.json` - All expenses

## 🔐 Security

- ✅ Admin-only endpoints protected
- ✅ Users can only see their own bookings
- ✅ Session-based authentication
- ✅ Server-side validation
- ✅ No client-side data manipulation

## 🚀 Next Steps (To Be Implemented)

Frontend UI components still needed:
1. Updated Admin Dashboard with 5 tabs in order
2. Sessions management UI
3. Invoice creation from session
4. Expense tracking UI
5. Financial overview calculations
6. User booking form update

---

## ✅ Backend Complete!

All API endpoints are ready and working. The server is fully functional and stores everything in JSON files. Now we just need to build the frontend UI to make it easy for Alina to use! 📸✨

