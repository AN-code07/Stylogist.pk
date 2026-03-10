import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // Your Stylogist Express backend
  headers: {
    'Content-Type': 'application/json',
  },
  // CRITICAL: This ensures cookies are sent with every cross-origin request
  withCredentials: true, 
});

export default axiosClient;