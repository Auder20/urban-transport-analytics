import { useNotifications } from '@/hooks/useNotifications'
import { Bell, Check, CheckCircle, AlertTriangle, Info, X } from 'lucide-react'

const getNotificationIcon = (type) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="w-4 h-4 text-green-500" />
    case 'warning':
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />
    case 'error':
      return <X className="w-4 h-4 text-red-500" />
    default:
      return <Info className="w-4 h-4 text-blue-500" />
  }
}

const getNotificationBadge = (type) => {
  const baseClasses = "px-2 py-1 text-xs font-medium rounded-full"
  switch (type) {
    case 'success':
      return `${baseClasses} bg-green-100 text-green-800`
    case 'warning':
      return `${baseClasses} bg-yellow-100 text-yellow-800`
    case 'error':
      return `${baseClasses} bg-red-100 text-red-800`
    default:
      return `${baseClasses} bg-blue-100 text-blue-800`
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    loadMore,
    markAsRead,
    markAllAsRead,
    hasMore,
    pagination
  } = useNotifications()

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id)
    }
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  if (isLoading && !notifications.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <X className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Error al cargar notificaciones
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {error.message || 'Ha ocurrido un error inesperado'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-primary-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Notificaciones
                </h1>
                {unreadCount > 0 && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {unreadCount} {unreadCount === 1 ? 'no leída' : 'no leídas'}
                  </p>
                )}
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="btn btn-secondary flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Marcar todas como leídas
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No tienes notificaciones
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Las notificaciones importantes aparecerán aquí
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                    !notification.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={getNotificationBadge(notification.type)}>
                          {notification.type}
                        </span>
                        {!notification.is_read && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            Nueva
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                        {notification.title}
                      </h3>
                      
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-500">
                          {formatDate(notification.created_at)}
                        </span>
                        
                        {notification.is_read && (
                          <span className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-500">
                            <Check className="w-3 h-3" />
                            Leído
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={loadMore}
                  disabled={isLoading}
                  className="w-full btn btn-secondary flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600" />
                  ) : (
                    <>
                      <span>Cargar más</span>
                      <span className="text-sm text-gray-500">
                        ({pagination?.total - notifications.length} restantes)
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
