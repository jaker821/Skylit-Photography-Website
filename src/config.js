// API Configuration
// In development: use localhost:5000
// In production: use the same domain (backend serves frontend)

const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const API_URL = isDevelopment 
  ? 'http://localhost:5000/api'
  : '/api'; // Use relative URL in production

export const GOOGLE_AUTH_URL = isDevelopment
  ? 'http://localhost:5000/api/auth/google'
  : '/api/auth/google';

