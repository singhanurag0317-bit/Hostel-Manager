import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
});

// Add interceptor for auth token if needed in future
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem('user');
    if (user) {
      const parsedUser = JSON.parse(user);
      // If your backend uses JWT, add it here:
      // config.headers.Authorization = `Bearer ${parsedUser.token}`;
    }
  }
  return config;
});

export default api;
