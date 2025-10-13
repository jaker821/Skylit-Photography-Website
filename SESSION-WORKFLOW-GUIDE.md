# Session Workflow Guide

## 📋 Overview

The Sessions Management system has been redesigned to support a comprehensive workflow from initial inquiry to final invoice. This guide explains how Alina can manage sessions from start to finish.

---

## 🔄 Session Lifecycle

### The Four Stages

```
1. PENDING    →    2. QUOTED    →    3. BOOKED    →    4. INVOICED
  (User Created)   (Admin Quote)   (Confirmed)     (Completed)
```

---

## 📊 Session Statuses

### 1. **Pending Sessions** ⏳
**What:** User bookings submitted through the website booking system  
**Who Creates:** Registered users booking online  
**Admin Actions:**
- Review session details (type, date, client info)
- **"Confirm & Book"** → Moves to **Booked** status

**Use Case:**  
Sarah visits your website, creates an account, and books a family portrait session. It appears in "Pending" awaiting your confirmation.

---

### 2. **Quoted Sessions** 💬
**What:** Quotes sent to potential clients who contact you directly  
**Who Creates:** Admin (Alina) manually creates these  
**Admin Actions:**
- Create quote with estimated pricing
- **"Client Approved - Book It"** → Moves to **Booked** status
- Edit quote details

**Use Case:**  
Someone emails you about a wedding shoot but isn't a registered user. You create a quote for them with details and pricing. Once they approve via email, you book it.

---

### 3. **Booked Sessions** 📅
**What:** Confirmed sessions ready for the photoshoot  
**Who Creates:** Sessions move here from Pending (user confirmed) or Quoted (client approved)  
**Admin Actions:**
- View all session details
- Edit session information
- **"Create Invoice"** → Opens invoice form → Moves to **Invoiced** status

**Use Case:**  
After confirming a pending booking or getting approval on a quote, the session is now booked. You can see all confirmed shoots here and prepare for them.

---

### 4. **Invoiced Sessions** ✅
**What:** Completed sessions that have been invoiced  
**Who Creates:** Sessions move here when you create an invoice from a Booked session  
**Admin Actions:**
- View invoice details
- View session details
- Track payment status (in Invoices tab)

**Use Case:**  
After completing a shoot, you create an invoice. The session moves here and an invoice is generated in the Invoices tab.

---

## 🎯 Common Workflows

### Workflow A: Online Booking (Registered User)
1. **User books online** → Creates **Pending** session
2. **Admin confirms** → Moves to **Booked**
3. **Shoot happens**
4. **Admin creates invoice** → Moves to **Invoiced**

### Workflow B: Email Inquiry (Non-Registered Client)
1. **Client emails inquiry**
2. **Admin creates Quote** → Creates **Quoted** session with pricing
3. **Admin sends quote to client** (via email)
4. **Client approves**
5. **Admin books quote** → Moves to **Booked**
6. **Shoot happens**
7. **Admin creates invoice** → Moves to **Invoiced**

### Workflow C: Direct Contact/Phone Call
1. **Client calls or texts**
2. **Admin creates Quote** → Even if they've already agreed, start with Quote
3. **Admin immediately books** → Moves to **Booked** (can skip quote approval if already confirmed)
4. **Shoot happens**
5. **Admin creates invoice** → Moves to **Invoiced**

---

## 📝 Creating a Quote

When you click **"+ Create Quote"**, you'll enter:

| Field | Required | Description |
|-------|----------|-------------|
| Client Name | ✅ | Full name of the client |
| Client Email | ✅ | Their email address |
| Session Type | ✅ | Wedding, Portrait, Family, etc. |
| Quote Amount | ⚪ | Estimated price (optional) |
| Proposed Date | ⚪ | Tentative shoot date |
| Proposed Time | ⚪ | Tentative shoot time |
| Location | ⚪ | Session location |
| Notes | ⚪ | Package details, special requests, etc. |

**Status:** Automatically set to "Quoted"

---

## 💰 Creating an Invoice

From a **Booked** session, click **"Create Invoice"**:

| Field | Description |
|-------|-------------|
| Amount | Pre-filled from quote amount (editable) |
| Due Date | Defaults to 30 days from now |
| Description | Pre-filled with session type and date |

**What Happens:**
1. Invoice is created in Invoices tab
2. Session status changes to "Invoiced"
3. Session is linked to the invoice
4. You can email/PDF the invoice from Invoices tab

---

## 🎨 Visual Organization

Each session card displays:

**Header:**
- Client name
- Status badge (color-coded)

**Body:**
- Session Type
- Date (and time if available)
- Location (if specified)
- Quote amount (for quoted sessions)
- Contact info (for booked sessions)
- Notes (if any)

**Actions:**
- Different buttons based on status
- Primary action button (full width)
- Secondary actions (smaller buttons)

---

## 🔍 Finding Sessions

### Visual Separation
Sessions are organized into **four distinct sections** on one scrollable page:
- **Pending Sessions** (top)
- **Quoted Sessions**
- **Booked Sessions**
- **Invoiced Sessions** (bottom)

Each section shows:
- Count of sessions in that status
- Description of what that section is for
- Grid of session cards (or "no data" message)

### Quick Scanning
- **Counts** in section titles help you see at a glance
- **Color-coded** borders (gold for quoted, purple for booked, green for invoiced)
- **Emoji icons** for each section make it visually scannable

---

## 💡 Best Practices

### For Pending Sessions
✅ Review within 24 hours  
✅ Check for scheduling conflicts before confirming  
✅ Contact client after booking to confirm details  

### For Quoted Sessions
✅ Add detailed notes about what package/pricing you discussed  
✅ Include quote amount so you remember what you quoted  
✅ Follow up if they haven't responded in a week  

### For Booked Sessions
✅ Confirm location and time a few days before shoot  
✅ Check equipment needed based on session type  
✅ Create invoice promptly after completing the shoot  

### For Invoiced Sessions
✅ Track payment in Invoices tab  
✅ Follow up on overdue invoices  
✅ Mark as "Paid" when payment received  

---

## 🔗 Integration with Other Features

### With Invoices Tab
- Creating an invoice from a session automatically links them
- Invoice shows which session it's for
- Can navigate between session and invoice

### With Calendar (Overview Tab)
- All Pending, Quoted, and Booked sessions appear on calendar
- Invoiced sessions also show (but might be greyed out)

### With Financial Overview
- Quoted sessions: Show potential revenue
- Invoiced sessions: Show actual revenue
- Helps track conversion from quote to booked to invoiced

---

## ❓ FAQ

**Q: What if a user books online but I need to quote them a different price?**  
A: You can edit the session details before confirming. Or confirm it and create a custom invoice amount when invoicing.

**Q: Can I skip the Quote stage for walk-in clients?**  
A: Yes! Create a Quote and immediately click "Book It" to move it to Booked.

**Q: What if a client cancels?**  
A: Edit the session and add notes, or delete it. (Cancel status coming in future update)

**Q: Can I have multiple sessions for the same client?**  
A: Absolutely! Each session is independent. Same client can have multiple pending/quoted/booked sessions.

**Q: Do quoted amounts automatically become invoice amounts?**  
A: Yes, but you can edit the invoice amount before submitting it.

---

## 🎯 Summary

The new workflow gives you complete control over your booking pipeline:

1. **See everything** in one place
2. **Track progress** from inquiry to payment
3. **Never miss** a follow-up with quoted sessions
4. **Streamline** the invoicing process
5. **Maintain** professionalism with organized client management

All four stages are visible at once, so you always know where each client is in the process!

---

**Happy Shooting! 📸**

