import { useState, useEffect, useCallback } from 'react'

const KEY        = 'wipsom_recently_viewed'
const MAX_ITEMS  = 12

/**
 * useRecentlyViewed
 *
 * Persists a list of recently viewed product objects in localStorage.
 * Call `push(product)` on every ProductDetailPage mount.
 * Read `items` to render the row.
 */
export function useRecentlyViewed() {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]')
    } catch {
      return []
    }
  })

  // Keep localStorage in sync whenever state changes
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(items)) } catch {}
  }, [items])

  const push = useCallback((product) => {
    if (!product?.id) return
    setItems(prev => {
      // Remove duplicate then prepend
      const filtered = prev.filter(p => p.id !== product.id)
      return [
        {
          id:             product.id,
          name:           product.name,
          price:          product.price,
          original_price: product.original_price,
          image_url:      product.image_url,
          rating:         product.rating,
          review_count:   product.review_count,
          category_name:  product.category_name,
        },
        ...filtered,
      ].slice(0, MAX_ITEMS)
    })
  }, [])

  const clear = useCallback(() => {
    setItems([])
    try { localStorage.removeItem(KEY) } catch {}
  }, [])

  return { items, push, clear }
}
