import { useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'

/**
 * useOrderSocket
 *
 * Connects to Socket.io, authenticates with the user's JWT,
 * and fires `onUpdate(payload)` whenever order:updated is received.
 *
 * @param {string|null} token   - JWT from AuthContext
 * @param {function}    onUpdate - callback({ order_id, status, tracking_number, updated_at })
 * @param {string[]}    watchIds - array of order IDs to watch specifically
 */
export function useOrderSocket(token, onUpdate, watchIds = []) {
  const socketRef   = useRef(null)
  const onUpdateRef = useRef(onUpdate)

  // Keep callback ref current without reconnecting
  useEffect(() => { onUpdateRef.current = onUpdate }, [onUpdate])

  useEffect(() => {
    if (!token) return

    const socket = io(SOCKET_URL, {
      auth:            { token },
      transports:      ['websocket', 'polling'],
      reconnection:    true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
    })
    socketRef.current = socket

    socket.on('connect', () => {
      console.log('🔌  Socket connected:', socket.id)
      // Subscribe to each specific order room
      watchIds.forEach(id => socket.emit('watch:order', id))
    })

    socket.on('order:updated', (payload) => {
      onUpdateRef.current?.(payload)
    })

    socket.on('connect_error', (err) => {
      console.warn('Socket connect error:', err.message)
    })

    return () => {
      watchIds.forEach(id => socket.emit('unwatch:order', id))
      socket.disconnect()
      socketRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  // Allow caller to dynamically add/remove watched orders
  const watchOrder = useCallback((orderId) => {
    socketRef.current?.emit('watch:order', orderId)
  }, [])

  const unwatchOrder = useCallback((orderId) => {
    socketRef.current?.emit('unwatch:order', orderId)
  }, [])

  return { watchOrder, unwatchOrder }
}
