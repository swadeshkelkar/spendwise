import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Only hard-redirect to /login on 401 when the user is on a protected route.
// Public pages (/, /login, /register, /verify-email) call /api/auth/me as a
// probe and must NOT be redirected when it 401s — AuthContext handles that.
const PUBLIC_PATHS = ['/', '/login', '/register', '/verify-email'];

api.interceptors.response.use(
  res => res,
  err => {
    const isPublic = PUBLIC_PATHS.some(p => window.location.pathname === p);
    if (err.response?.status === 401 && !isPublic) {
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
