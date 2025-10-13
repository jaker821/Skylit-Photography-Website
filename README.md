# Skylit Photography Portfolio Website

Professional portfolio website for photographer Alina Suedbeck.

## Features

### Public Pages
- Home - Landing page with hero section and featured work
- Portfolio - Gallery of photography work
- Pricing - Session packages and pricing information
- About - Information about Alina Suedbeck
- Contact - Contact form and booking information

### User Features
- User authentication and login
- Book photography sessions
- View booking history
- User profile management

### Admin Dashboard
- Finance tracking and overview
- Invoicing system
- Upload and manage portfolio photos
- Expense tracking
- Client management
- Session management with workflow (Pending → Quoted → Booked → Invoiced)
- User approval system
- Dynamic pricing management

## Tech Stack
- React.js 18.2.0
- React Router for navigation
- Vite 5.0.0 for build tooling
- Node.js + Express backend
- CSS3 with animations and light/dark mode
- Dark purple and gold color scheme

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run development server:
```bash
npm run dev:all
```

3. Build for production:
```bash
npm run build
```

For detailed setup instructions, see [GETTING-STARTED.md](./GETTING-STARTED.md)

## Documentation

- [Getting Started Guide](./GETTING-STARTED.md)
- [Deployment Guide](./DEPLOYMENT-GUIDE.md)
- [Project Overview](./PROJECT-OVERVIEW.md)
- [Backend Setup](./BACKEND-SETUP.md)
- [Environment Variables](./ENVIRONMENT-VARIABLES.md)

---

## 🚀 Future Features

### Planned Enhancements:
- [ ] **DigitalOcean Spaces Integration** - Persistent image storage with CDN
- [ ] **PostgreSQL Database** - Replace JSON file storage with proper database
- [ ] **Email Notifications** - Automated emails for booking confirmations and approvals
- [ ] **Payment Integration** - Stripe/PayPal for invoice payments
- [ ] **Google Calendar Integration** - Sync sessions with Google Calendar
- [ ] **Client Galleries** - Private galleries for clients to view and download photos
- [ ] **Photo Proofing System** - Clients can select favorite photos
- [ ] **Contract Management** - Digital contracts and e-signatures
- [ ] **Mobile App** - Native mobile application for iOS and Android
- [ ] **Advanced Analytics** - Business insights and revenue tracking
- [ ] **SMS Notifications** - Text message reminders for upcoming sessions
- [ ] **Multi-language Support** - Internationalization (i18n)
- [ ] **SEO Optimization** - Enhanced search engine optimization
- [ ] **Blog System** - Photography tips and client stories
- [ ] **Social Media Integration** - Direct sharing to Instagram, Facebook, etc.

### Under Consideration:
- Online booking calendar with real-time availability
- Gift certificates and vouchers
- Referral program for clients
- Equipment inventory tracking
- Tax reporting and expense categorization
- Second shooter/assistant management
- Watermarking system for proofs
- Print shop integration

---

## 📋 Version Log

### Version 1.0.0 - Initial Production Release (October 13, 2024)
**Status:** ✅ Live in Production

#### 🎨 Public Features:
- **Responsive Website** - Fully responsive design for all devices
- **Home Page** - Hero section with featured work gallery
- **Dynamic Portfolio** - Category-based filtering, dynamically generated from uploaded shoots
- **Pricing Page** - Admin-configurable packages and add-ons with "Most Popular" flagging
- **About Page** - Photographer biography and information
- **Contact Page** - Contact information and inquiry form
- **Light/Dark Mode** - Full theme toggle with persistent preference

#### 👤 User Features:
- **Email/Password Authentication** - Secure registration and login
- **Admin Approval Workflow** - New registrations require admin approval
- **User Dashboard** - View bookings and session history
- **Session Booking** - Request photography sessions
- **Profile Management** - Update email, phone, password; delete account
- **Google OAuth Ready** - Infrastructure in place (currently disabled)

#### 👑 Admin Features:
- **7-Tab Dashboard:**
  - **Overview** - Financial analytics, revenue/expense tracking, session calendar
  - **Sessions** - Complete workflow management (Pending → Quoted → Booked → Invoiced)
  - **Portfolio** - Create shoots, upload photos, manage categories
  - **Expenses** - Track business expenses with filterable views
  - **Invoices** - Generate and manage client invoices
  - **Pricing** - Configure packages and add-ons dynamically
  - **Users** - Approve/reject registrations, manage accounts

- **Session Workflow:**
  - Accept/reject user booking requests (Pending)
  - Create manual quotes for walk-in clients (Quoted)
  - Track confirmed sessions (Booked)
  - Generate invoices after completion (Invoiced)

- **Portfolio Management:**
  - Create photo shoots with categories
  - Upload multiple photos per shoot
  - Automatic category generation on public portfolio
  - Photo deletion and shoot management

- **Business Management:**
  - Real-time financial overview
  - Revenue and expense tracking
  - Profit calculations
  - Invoice generation and management
  - Expense categorization

#### 🛠️ Technical Stack:
- **Frontend:** React 18.2.0, React Router 6.20.0, Vite 5.0.0
- **Backend:** Node.js, Express 4.18.2
- **Authentication:** Passport.js with session management
- **File Uploads:** Multer for image handling
- **Styling:** Custom CSS with CSS variables for theming
- **Deployment:** DigitalOcean App Platform with GitHub auto-deploy
- **Environment Detection:** Dynamic API URLs for dev/production

#### ⚠️ Known Limitations (v1.0.0):
- **Ephemeral Storage:** Uploaded images and JSON data reset on deployment
- **JSON File Storage:** Using filesystem JSON files (temporary solution)
- **No Email System:** User notifications are manual
- **Google OAuth Disabled:** Feature exists but not configured by default
- **No Payment Processing:** Invoices are tracked but not paid online
- **Manual Backups Required:** Data must be manually exported/backed up

#### 📝 Deployment Notes:
- Deployed to DigitalOcean App Platform
- Auto-deployment enabled from GitHub main branch
- Environment variables configured for production
- HTTPS enabled by default
- Build time: ~2 minutes
- Zero-downtime deployments

#### 🔜 Next Planned Updates (v1.1.0):
- DigitalOcean Spaces integration for persistent image storage
- PostgreSQL database migration
- Email notification system
- Google OAuth enablement

---

## Contact
- **Email:** skylit.photography25@gmail.com
- **Location:** Raleigh, NC
- **Website:** [Live Site](https://skylit-website-86r3u.ondigitalocean.app)

## License
MIT

