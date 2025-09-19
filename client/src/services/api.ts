import axios from 'axios';

// Create an axios instance with a base URL for our backend
const api = axios.create({
  baseURL: 'http://localhost:5001/api', // The base URL of our Express server
  headers: {
    'Content-Type': 'application/json',
  },
});

// We can add interceptors here later to automatically add the JWT token to every request

export default api;
