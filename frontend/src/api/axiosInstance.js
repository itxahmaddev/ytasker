import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Only an expired/invalid session should log the user out — a 401 for a
    // wrong "current password" is a normal form error and must not.
    const message = err.response?.data?.message || '';
    if (
      err.response?.status === 401 &&
      message.startsWith('Not authorized') &&
      localStorage.getItem('token')
    ) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export function errorMessage(err, fallback = 'Something went wrong') {
  if (err.response?.data?.message) return err.response.data.message;
  if (err.code === 'ERR_NETWORK') return 'Cannot reach the server. Check your connection.';
  return fallback;
}

export default api;
