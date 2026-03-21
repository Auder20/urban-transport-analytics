import { useState, useCallback, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import { useWebSocket } from './useWebSocket'

export function useNotifications() {
  const [offset, setOffset] = useState(0)
  const limit = 20
  const queryClient = useQueryClient()
  const { isConnected, notifications: wsNotifications, socket } = useWebSocket()

  // HTTP polling for initial load and fallback
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['notifications', offset],
    queryFn: async () => {
      const response = await api.get('/notifications', {
        params: { limit, offset }
      })
      return response.data
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
    keepPreviousData: true // Keep previous data while loading new page
  })

  // Merge WebSocket notifications with HTTP notifications
  const allNotifications = wsNotifications.length > 0 
    ? [...wsNotifications, ...(data?.notifications || [])]
    : (data?.notifications || [])

  // WebSocket event handlers
  useEffect(() => {
    if (!isConnected || !socket) return

    const handleNewNotification = (notification) => {
      // Update query cache with new notification
      queryClient.setQueriesData(['notifications'], (oldData) => {
        if (!oldData) return oldData
        
        return {
          ...oldData,
          notifications: [notification, ...oldData.notifications.slice(0, 49)], // Keep only last 50
          unreadCount: oldData.unreadCount + 1
        }
      })
    }

    socket.on('notification:new', handleNewNotification)
    socket.on('notification:read', (data) => {
      // Update query cache when notification is marked as read via WebSocket
      queryClient.setQueriesData(['notifications'], (oldData) => {
        if (!oldData) return oldData
        
        return {
          ...oldData,
          notifications: oldData.notifications.map(notification =>
            notification.id === data.notificationId
              ? { ...notification, is_read: true }
              : notification
          ),
          unreadCount: Math.max(0, oldData.unreadCount - 1)
        }
      })
    })

    return () => {
      queryClient.invalidateQueries(['notifications']),
      socket?.emit('notification:read', { notificationId: id })
    }
  }, [isConnected, socket])

  const loadMore = useCallback(() => {
    if (data?.pagination?.hasMore) {
      setOffset(prev => prev + limit)
    }
  }, [data?.pagination?.hasMore, limit])

  const resetPagination = useCallback(() => {
    setOffset(0)
    queryClient.invalidateQueries(['notifications'])
  }, [queryClient])

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`)
      // Update local cache optimistically
      queryClient.setQueriesData(['notifications'], (oldData) => {
        if (!oldData) return oldData
        
        return {
          ...oldData,
          notifications: oldData.notifications.map(notification =>
            notification.id === notificationId
              ? { ...notification, is_read: true }
              : notification
          ),
          unreadCount: Math.max(0, oldData.unreadCount - 1)
        }
      })
      
      // Also notify via WebSocket for real-time sync
      socket?.emit('notification:read', { notificationId })
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      throw error
    }
  }, [queryClient, socket])

  const markAllAsRead = useCallback(async () => {
    try {
      await api.put('/notifications/read-all')
      // Update local cache optimistically
      queryClient.setQueriesData(['notifications'], (oldData) => {
        if (!oldData) return oldData
        
        return {
          ...oldData,
          notifications: oldData.notifications.map(notification => ({
            ...notification,
            is_read: true
          })),
          unreadCount: 0
        }
      })
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
      throw error
    }
  }, [queryClient, socket])

  return {
    data,
    isLoading,
    error,
    refetch,
    loadMore,
    resetPagination,
    markAsRead,
    markAllAsRead,
    hasMore: data?.pagination?.hasMore || false,
    notifications: allNotifications,
    unreadCount: data?.unreadCount || 0,
    pagination: data?.pagination || { limit, offset, total: 0, hasMore: false }
  }
}
