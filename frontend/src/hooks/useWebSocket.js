import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAppStore } from '@/store/useAppStore'

export function useBusLocationSocket(onUpdate) {
  const { token } = useAppStore()
  const socketRef = useRef(null)
  const onUpdateRef = useRef(onUpdate)

  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])

  useEffect(() => {
    const WS_URL = import.meta.env.VITE_WS_URL || window.location.origin

    socketRef.current = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    })

    socketRef.current.on('bus:location:update', (data) => {
      onUpdateRef.current(data)
    })

    socketRef.current.on('connect', () => {
      console.log('🔌 Connected to WebSocket server')
    })

    socketRef.current.on('disconnect', () => {
      console.log('🔌 Disconnected from WebSocket server')
    })

    socketRef.current.on('connect_error', (error) => {
      console.error('🔌 WebSocket connection error:', error)
    })

    return () => {
      socketRef.current?.disconnect()
    }
  }, [token])

  return socketRef
}
