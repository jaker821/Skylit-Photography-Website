# Skylit Photography - Setup Guide

## Installation

1. **Install Node.js** (v18 or higher recommended)
   - Download from https://nodejs.org/

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   The site will be available at http://localhost:3000

## Demo Credentials

### Admin Login
- Email: `admin@skylit.com`
- Password: `admin123`

### User Login
- Email: `user@example.com`
- Password: `user123`

## Project Structure

```
skylit-photography/
├── src/
│   ├── components/         # Reusable components
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   └── ProtectedRoute.jsx
│   ├── pages/             # Page components
│   │   ├── Home.jsx
│   │   ├── Portfolio.jsx
│   │   ├── Pricing.jsx
│   │   ├── About.jsx
│   │   ├── Contact.jsx
│   │   ├── Login.jsx
│   │   ├── UserDashboard.jsx
│   │   └── AdminDashboard.jsx
│   ├── context/           # React Context
│   │   └── AuthContext.jsx
│   ├── App.jsx            # Main app component
│   ├── App.css            # Global styles
│   └── main.jsx           # Entry point
├── public/                # Static assets
├── index.html             # HTML template
├── package.json           # Dependencies
└── vite.config.js         # Vite configuration
```

## Customization

### Updating Colors

The color scheme uses CSS variables defined in `src/App.css`. Update these variables with your RGB color codes:

```css
:root {
  /* Primary Colors - Dark Purple */
  --primary-purple: #3d1a52;
  --primary-purple-dark: #2b1139;
  --primary-purple-light: #5a2772;
  
  /* Accent Colors - Gold */
  --accent-gold: #d4af37;
  --accent-gold-dark: #b8941f;
  --accent-gold-light: #f0d86d;
}
```

### Adding Real Images

Replace placeholder image sections with actual photos:

1. Add images to the `public/images/` folder
2. Update components to reference real images instead of placeholders

Example in `Home.jsx`:
```jsx
// Replace
<div className="featured-image-placeholder">
  <span>Wedding Photography</span>
</div>

// With
<img src="/images/wedding-1.jpg" alt="Wedding Photography" />
```

### Setting Up a Backend

This is currently a frontend-only application with demo authentication. To add a real backend:

1. Create a backend API (Node.js/Express, Python/Flask, etc.)
2. Update `AuthContext.jsx` to call your authentication API
3. Add API calls for:
   - User registration and login
   - Booking management
   - Admin dashboard features
   - Contact form submissions
   - Portfolio image uploads

## Features

### Public Pages
- **Home**: Landing page with hero section and featured work
- **Portfolio**: Filterable gallery of photography work
- **Pricing**: Package information and booking options
- **About**: Photographer bio and philosophy
- **Contact**: Contact form and information

### User Dashboard
- Book new photography sessions
- View booking history
- Manage account information

### Admin Dashboard
- **Overview**: Financial summary and upcoming sessions
- **Invoices**: Create and manage invoices
- **Expenses**: Track business expenses
- **Sessions**: Manage client sessions
- **Portfolio**: Upload and organize portfolio images

## Building for Production

```bash
npm run build
```

This creates an optimized build in the `dist/` folder ready for deployment.

## Deployment Options

### Netlify
1. Push code to GitHub
2. Connect repository to Netlify
3. Deploy automatically

### Vercel
1. Push code to GitHub
2. Import project in Vercel
3. Deploy automatically

### Traditional Hosting
1. Run `npm run build`
2. Upload contents of `dist/` folder to your web host

## Next Steps

1. **Add Real Images**: Replace placeholder images with professional photos
2. **Update Color Codes**: Apply the exact RGB values for purple and gold
3. **Backend Integration**: Connect to a real authentication and database system
4. **Email Integration**: Set up contact form to send emails
5. **Payment Processing**: Add Stripe or PayPal for booking deposits
6. **Google Analytics**: Add tracking code for analytics
7. **SEO Optimization**: Add meta tags, sitemap, robots.txt
8. **Custom Domain**: Point your domain to the deployed site

## Support

For questions or issues, contact: skylit.photography25@gmail.com

