import axios from 'axios';

// Use the Vercel environment variable in production, fall back to localhost for development
const baseURL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5001';

const api = axios.create({
  baseURL: `${baseURL}/api`, // Make sure to add /api
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;