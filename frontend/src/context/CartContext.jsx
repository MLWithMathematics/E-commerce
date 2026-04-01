import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/client'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)

export const CartProvider = ({ children }) => {
  const { user } = useAuth()
  const [items, setItems]   = useState([])
  const [total, setTotal]   = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchCart = useCallback(async () => {
    if (!user) { setItems([]); setTotal(0); return }
    try {
      setLoading(true)
      const { data } = await api.get('/cart')
      setItems(data.items)
      setTotal(data.total)
    } catch { /* silent */ } finally { setLoading(false) }
  }, [user])

  useEffect(() => { fetchCart() }, [fetchCart])

  const upsert = async (product_id, quantity) => {
    await api.post('/cart', { product_id, quantity })
    fetchCart()
  }

  const remove = async (product_id) => {
    await api.post('/cart', { product_id, quantity: 0 })
    fetchCart()
  }

  const clear = async () => {
    await api.delete('/cart')
    fetchCart()
  }

  const count = items.reduce((s, i) => s + i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, total, count, loading, upsert, remove, clear, refetch: fetchCart }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
