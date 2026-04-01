import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sv_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Global 401 handler
// IMPORTANT: Skip /auth/* routes so login/signup errors bubble up
// to the component and show inline — not redirect away.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || ''
    const isAuthRoute = url.startsWith('/auth/')
    if (err.response?.status === 401 && !isAuthRoute) {
      // Session expired on a protected route — clear and redirect
      localStorage.removeItem('sv_token')
      localStorage.removeItem('sv_user')
      window.location.href = '/login'
    }
    // Always reject so components can catch and display errors
    return Promise.reject(err)
  }
)

export default api
