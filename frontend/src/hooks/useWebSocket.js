import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAppStore } from '@/store/useAppStore'

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const [socket, setSocket] = useState(null)
  const socketRef = useRef(null)
  const { token } = useAppStore()

  useEffect(() => {
    if (!token) return

    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
      setSocket(null)
    }

    const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001'
    const newSocket = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    })
    socketRef.current = newSocket

    newSocket.on('connect', () => {
      console.log('🔌 WebSocket connected')
      setIsConnected(true)
      setSocket(newSocket)
    })

    newSocket.on('authenticated', (data) => {
      console.log('✅ WebSocket authenticated', data)
    })

    newSocket.on('auth_error', (error) => {
      console.error('❌ WebSocket authentication failed:', error)
    })

    newSocket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected')
      setIsConnected(false)
      setSocket(null)
    })

    newSocket.on('connect_error', (error) => {
      console.error('🔌 WebSocket connection error:', error)
      setIsConnected(false)
    })

    return () => {
      socketRef.current?.disconnect()
      socketRef.current = null
      setSocket(null)
    }
  }, [token])

  return { isConnected, socket }
}
