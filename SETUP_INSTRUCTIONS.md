# Email Contact Form Setup Instructions

## What I've Implemented

I've added email functionality to your contact form. Here's what was changed:

1. **Installed Nodemailer** - Email sending library
2. **Created `/api/contact/send` endpoint** - Backend route to handle contact form submissions
3. **Updated Contact.jsx** - Form now sends data to the backend API
4. **Fallback behavior** - If email isn't configured, it logs to console (useful for testing)

## Setup Steps

### Option 1: Gmail Setup (Recommended for Quick Start)

1. **Go to your Gmail account** (your-email@gmail.com)

2. **Enable 2-Factor Authentication** (Required to create App Password)
   - Go to: https://myaccount.google.com/security
   - Enable 2FA if not already enabled

3. **Create an App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "Skylit Photography Contact Form"
   - Click "Generate"
   - Copy the 16-character password (it will look like: `abcd efgh ijkl mnop`)

4. **Add to your `.env` file** (in the project root):
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password-here
ADMIN_EMAIL=your-admin-email@gmail.com
```

### Option 2: SMTP Setup (For other email providers)

If you want to use a different email provider (Outlook, Yahoo, etc.):

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
ADMIN_EMAIL=your-admin-email@gmail.com
```

Then update the nodemailer configuration in `server/server.js` around line 2832:
```javascript
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});
```

### Option 3: Use a Professional Email Service (For Production)

For production, I recommend using a service like:
- **SendGrid** (Free tier: 100 emails/day)
- **Mailgun** (Free tier: 5,000 emails/month)
- **Resend** (Free tier: 3,000 emails/month)

## Testing

1. **Without Email Configuration** (Development):
   - The form will work and show success
   - Check your server console for the logged email content
   - This is perfect for testing locally

2. **With Email Configuration**:
   - Fill out the contact form
   - You should receive an email at the `ADMIN_EMAIL` address
   - The email will include all form fields nicely formatted

## Security Notes

- **Never commit your `.env` file** to git (it should already be in `.gitignore`)
- **Use App Passwords, not your regular password** for email services
- For production, consider using environment variables on your hosting platform

## Troubleshooting

**"Less secure app access" error:**
- Make sure you're using an App Password, not your regular Gmail password
- Make sure 2FA is enabled on your Google account

**Emails not sending:**
- Check server console for error messages
- Verify environment variables are set correctly
- Make sure your hosting platform allows outbound email (some shared hosting blocks SMTP)

**Want to test without email?**
- Just don't set EMAIL_USER and EMAIL_PASSWORD
- The form will still work and show success message
- Check server logs to see what would have been sent

## What Gets Emailed

The email includes:
- Sender's name
- Sender's email (as reply-to)
- Phone number
- Session type
- Preferred date (if provided)
- Full message
- HTML formatted with your brand colors

## Next Steps

1. Set up your email environment variables
2. Test the form by submitting a message
3. Check your inbox for the email
4. Deploy these changes to your production server

