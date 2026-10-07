// Where the Ytasker app lives. Set VITE_APP_URL at build time for production.
export const APP_URL = (import.meta.env.VITE_APP_URL || 'http://localhost:5174').replace(/\/$/, '');
