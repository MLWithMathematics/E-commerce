import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/client'
import { useAuth } from './AuthContext'

const WishlistContext = createContext(null)

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth()
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(false)

  const fetchWishlist = useCallback(async () => {
    if (!user) { setItems([]); return }
    try {
      setLoading(true)
      const { data } = await api.get('/wishlist')
      setItems(data)
    } catch { /* silent */ } finally { setLoading(false) }
  }, [user])

  useEffect(() => { fetchWishlist() }, [fetchWishlist])

  const toggle = async (product_id) => {
    const { data } = await api.post('/wishlist', { product_id })
    // Optimistically update: if wishlisted, we need to refetch to get full product data
    if (data.wishlisted) {
      fetchWishlist()
    } else {
      setItems(prev => prev.filter(i => i.product_id !== product_id))
    }
    return data.wishlisted
  }

  const isWishlisted = (product_id) =>
    items.some(i => i.product_id === product_id)

  const count = items.length

  return (
    <WishlistContext.Provider value={{ items, loading, count, toggle, isWishlisted, refetch: fetchWishlist }}>
      {children}
    </WishlistContext.Provider>
  )
}

export const useWishlist = () => useContext(WishlistContext)
