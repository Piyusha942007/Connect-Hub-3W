import axios from 'axios';

// Create an instance of Axios
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Automatically attach JWT token to all requests if present
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Centralized API error mapping
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // If token is expired or unauthorized (401), optionally trigger state cleanup or redirect
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized or session expired, cleaning up token.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // We don't force a redirect here to avoid breaking unauthenticated public feed reading;
      // instead, the app state (AuthContext) will listen to the token deletion.
    }
    
    // Normalize and return error messages
    const message = error.response?.data?.message || 'Something went wrong with the connection.';
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
