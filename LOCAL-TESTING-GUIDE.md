# Local Testing Guide - Skylit Photography

## Prerequisites

Before running locally, ensure you have:
- ✅ Node.js installed (v14 or higher)
- ✅ npm installed (comes with Node.js)

## Step-by-Step Instructions

### 1. Install Dependencies (First Time Only)

Open your terminal in the project directory and run:

```bash
npm install
```

This installs all required packages for both frontend and backend.

### 2. Start the Backend Server

In your first terminal window:

```bash
npm run server
```

**What this does:**
- Starts the Express backend server
- Runs on `http://localhost:5000`
- Serves API endpoints
- Handles authentication, bookings, uploads, etc.

**You should see:**
```
Server running on port 5000
```

**Keep this terminal window open** - the server needs to stay running.

### 3. Start the Frontend Development Server

Open a **second terminal window** (keep the first one running!) and run:

```bash
npm run dev
```

**What this does:**
- Starts the Vite development server
- Runs on `http://localhost:5173` (usually)
- Hot-reloads when you make changes
- Serves your React application

**You should see:**
```
  VITE v4.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 4. Open in Browser

1. Open your browser
2. Go to `http://localhost:5173` (or whatever port Vite shows)
3. The website should load with the new dark theme!

## Testing the Changes

### Pages to Test:

✅ **Public Pages:**
- Home (`/`)
- Portfolio (`/portfolio`)
- Pricing (`/pricing`)
- About (`/about`)
- Contact (`/contact`)

✅ **Authentication:**
- Login (`/login`)
- Register (`/register`)

✅ **User Dashboard:**
- Login as a regular user
- Check Dashboard (`/dashboard`)
- Check Profile (`/profile`)

✅ **Admin Dashboard:**
- Login as admin
- Check Admin Dashboard (`/admin`)
- Test all tabs (Overview, Invoices, Expenses, Sessions, Portfolio)

### What to Look For:

1. ✅ **Dark theme is applied** everywhere
2. ✅ **Text is readable** (cream on dark backgrounds)
3. ✅ **Headings are gold** colored
4. ✅ **Cards have dark backgrounds** with gold borders
5. ✅ **Forms work** and have proper styling
6. ✅ **Buttons are visible** and clickable
7. ✅ **No theme toggle button** in navbar (removed)
8. ✅ **Responsive design** works on mobile

### Testing on Mobile:

1. In your browser, press `F12` to open DevTools
2. Click the device toolbar icon (or press `Ctrl+Shift+M`)
3. Select a mobile device
4. Test navigation, forms, and responsiveness

## Common Issues & Solutions

### Issue: "npm: command not found"
**Solution:** Install Node.js from https://nodejs.org/

### Issue: "Port 5000 is already in use"
**Solution:** 
```bash
# Windows PowerShell:
netstat -ano | findstr :5000
# Find the PID, then:
taskkill /PID <PID> /F

# Or change the port in server/server.js:
const PORT = process.env.PORT || 5001;
```

### Issue: "Port 5173 is already in use"
**Solution:** Vite will automatically try the next available port (5174, 5175, etc.)

### Issue: Frontend can't connect to backend
**Solution:** Check that both servers are running. The frontend is configured to proxy API requests to the backend.

### Issue: Changes not showing up
**Solution:** 
- Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Clear browser cache
- Stop and restart the dev server

## Making Changes

### CSS Changes:
1. Edit `src/App.css`
2. Save the file
3. Browser automatically refreshes (hot reload)

### Component Changes:
1. Edit any file in `src/`
2. Save the file
3. Browser automatically refreshes

### Backend Changes:
1. Edit `server/server.js`
2. Save the file
3. **Restart the backend server** (Ctrl+C, then `npm run server` again)

## Stopping the Servers

### Stop Backend:
1. Go to the terminal running the backend
2. Press `Ctrl+C`

### Stop Frontend:
1. Go to the terminal running the frontend
2. Press `Ctrl+C`

## Development Scripts

Available npm scripts (from `package.json`):

```bash
npm run dev          # Start frontend dev server
npm run server       # Start backend server
npm run build        # Build for production
npm run preview      # Preview production build
```

## Environment Variables

If you have a `.env` file with configurations:

```env
PORT=5000
# Add other environment variables as needed
```

Make sure it's in the root directory and properly configured.

## Next Steps After Testing

Once you've verified everything works locally:

1. ✅ Test all pages and functionality
2. ✅ Check mobile responsiveness
3. ✅ Verify user flows (login, register, booking, etc.)
4. ✅ Make any final adjustments
5. ✅ Commit changes to git
6. ✅ Deploy to Digital Ocean

## Quick Reference

### Both Servers (Recommended)
```bash
# Terminal 1:
npm run server

# Terminal 2:
npm run dev
```

Then visit: `http://localhost:5173`

---

**Happy Testing!** 🚀

If you encounter any issues not covered here, check the console for error messages or create an issue.




