# Skylit Photography Portfolio Website

Professional portfolio website for photographer Alina Suedbeck.

## Features

### Public Pages
- **Home** - Landing page with hero section and featured work
- **Portfolio** - Gallery of photography work with category filtering
- **Pricing** - Session packages and pricing information
- **About** - Information about Alina Suedbeck
- **Contact** - Contact form and booking information

### User Features
- User authentication and login
- Book photography sessions
- View booking history
- User profile management
- Download high-resolution photos (with permission)

### Admin Dashboard
- Upload and manage portfolio photos
- Create photo shoots with categories
- Manage user permissions for photo downloads
- User approval system
- Session management
- Financial tracking and invoicing
- Expense tracking

## Tech Stack

- **Frontend:** React.js 18.2.0, React Router, Vite
- **Backend:** Node.js + Express
- **Database:** SQLite (persistent across deployments)
- **Storage:** DigitalOcean Spaces (S3-compatible with CDN)
- **Authentication:** Session-based with bcrypt password hashing
- **File Uploads:** Multer + Sharp (image compression)
- **Styling:** CSS3 with dark/light mode support

## Key Features

- **Persistent Storage:** Photos and data survive deployments
- **Image Optimization:** Automatic compression for web display
- **Dual Storage:** Compressed versions for web, originals for download
- **User Permissions:** Email-based access control for high-res downloads
- **Upload Progress:** Real-time progress bars for photo uploads
- **Phone Formatting:** Automatic phone number formatting
- **Responsive Design:** Works on all devices

## Getting Started

1. **Install dependencies:**
```bash
npm install
```

2. **Run development server:**
```bash
npm run dev:all
```

3. **Build for production:**
```bash
npm run build
```

## Environment Variables

Required for DigitalOcean Spaces:
- `SPACES_ENDPOINT`
- `SPACES_REGION` 
- `SPACES_BUCKET`
- `SPACES_ACCESS_KEY`
- `SPACES_SECRET_KEY`
- `SPACES_CDN_URL`

## Default Admin Login

- **Email:** admin@skylit.com
- **Password:** admin123

## Deployment

Deployed on DigitalOcean App Platform with automatic GitHub integration.

## Contact

- **Email:** skylit.photography25@gmail.com
- **Location:** Raleigh/Durham, NC
- **Website:** [Live Site](https://skylit-website-86r3u.ondigitalocean.app)

## License

MIT