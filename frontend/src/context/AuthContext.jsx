import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(() => {
    try { return JSON.parse(localStorage.getItem('sv_user')) } catch { return null }
  })
  const [loading, setLoading] = useState(true)

  // Verify token on mount
  useEffect(() => {
    const token = localStorage.getItem('sv_token')
    if (!token) { setLoading(false); return }
    api.get('/auth/me')
      .then(r => setUser(r.data))
      .catch(() => logout())
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('sv_token', data.token)
    localStorage.setItem('sv_user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const signup = async (payload) => {
    const { data } = await api.post('/auth/signup', payload)
    localStorage.setItem('sv_token', data.token)
    localStorage.setItem('sv_user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    localStorage.removeItem('sv_token')
    localStorage.removeItem('sv_user')
    setUser(null)
  }

  const updateUser = (updates) => {
    const updated = { ...user, ...updates }
    localStorage.setItem('sv_user', JSON.stringify(updated))
    setUser(updated)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
