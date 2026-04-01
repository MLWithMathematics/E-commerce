import axios from 'axios'

// ── FIXED: single consistent variable name 'api' throughout ──
// VITE_API_URL must be set in Vercel environment variables
// e.g. https://your-railway-backend.up.railway.app/api
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
})

// ── Attach JWT on every request ───────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sv_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Global response handler ───────────────────────────────────
// IMPORTANT: Skip /auth/* routes so login errors show inline
// instead of redirecting away to /login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || ''
    const isAuthRoute = url.startsWith('/auth/')
    if (err.response?.status === 401 && !isAuthRoute) {
      // Session expired on protected route — clear and redirect
      localStorage.removeItem('sv_token')
      localStorage.removeItem('sv_user')
      window.location.href = '/login'
    }
    // Always reject so components can catch and display errors
    return Promise.reject(err)
  }
)

export default api
