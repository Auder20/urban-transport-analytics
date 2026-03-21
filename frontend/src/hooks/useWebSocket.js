import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAppStore } from '@/store/useAppStore'

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const [notifications, setNotifications] = useState([])
  const socketRef = useRef(null)
  const { token } = useAppStore()

  useEffect(() => {
    if (!token) return

    // Initialize WebSocket connection
    const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001'
    const socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    })
    socketRef.current = socket

    socket.on('connect', () => {
      console.log('🔌 WebSocket connected')
      setIsConnected(true)
    })

    socket.on('authenticated', (data) => {
      console.log('✅ WebSocket authenticated', data)
    })

    socket.on('notification:new', (notification) => {
      console.log('📬 New notification received:', notification)
      setNotifications(prev => [notification, ...prev.slice(0, 49)]) // Keep only last 50
    })

    socket.on('auth_error', (error) => {
      console.error('❌ WebSocket authentication failed:', error)
    })

    socket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected')
      setIsConnected(false)
      socketRef.current = null
    })

    socket.on('connect_error', (error) => {
      console.error('🔌 WebSocket connection error:', error)
      setIsConnected(false)
    })

    return () => {
      socketRef.current?.disconnect()
    }
  }, [token])

  return {
    isConnected,
    notifications,
    socket: socketRef.current
  }
}
