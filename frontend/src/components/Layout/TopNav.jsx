import { useState, useEffect, useCallback, useRef } from 'react'
import { Bell, Search, User, Settings, LogOut, Bus, Route, MapPin } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { MobileMenuButton } from './Sidebar'
import api from '@/services/api'
import { useNotifications } from '@/hooks/useNotifications'

export default function TopNav({ title }) {
  const { user, logout } = useAppStore()
  const navigate = useNavigate()
  const { data: notificationsData, isLoading: notificationsLoading } = useNotifications()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState({ buses: [], routes: [], stations: [] })
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const searchTimeoutRef = useRef(null)

  const notifications = notificationsData?.notifications || []
  const unreadCount = notificationsData?.unreadCount || 0

  // Debounced search function
  const performSearch = useCallback(async (query) => {
    if (query.length < 2) {
      setSearchResults({ buses: [], routes: [], stations: [] })
      setShowSearchDropdown(false)
      return
    }

    setSearchLoading(true)
    try {
      const response = await api.get(`/api/search?q=${query}`)
      setSearchResults(response.data)
      setShowSearchDropdown(true)
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults({ buses: [], routes: [], stations: [] })
    } finally {
      setSearchLoading(false)
    }
  }, [])

  // Handle search input with debouncing
  const handleSearchChange = (e) => {
    const query = e.target.value
    setSearchQuery(query)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query)
    }, 300)
  }

  // Navigate to search result
  const handleNavigateToResult = (type, item) => {
    setShowSearchDropdown(false)
    setSearchQuery('')
    
    switch (type) {
      case 'buses':
        navigate(`/buses/${item.id}`)
        break
      case 'routes':
        navigate(`/routes/${item.id}`)
        break
      case 'stations':
        navigate(`/stations/${item.id}`)
        break
      default:
        break
    }
  }

  const handleLogout = () => {
    logout()
    setShowUserMenu(false)
  }
  
  const handleNavigateToSettings = () => {
    navigate('/settings')
    setShowUserMenu(false)
  }

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.put(`/api/notifications/${notificationId}/read`)
      // Refetch notifications will happen automatically due to React Query
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side */}
          <div className="flex items-center gap-4">
            <MobileMenuButton />
            {title && <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h1>}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search routes, buses, stations..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => searchQuery.length >= 2 && setShowSearchDropdown(true)}
                  onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64"
                />

                {/* Search dropdown */}
                {showSearchDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-80 overflow-y-auto">
                    {searchLoading ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mx-auto mb-2"></div>
                        Searching...
                      </div>
                    ) : (
                      <>
                        {/* Buses section */}
                        {searchResults.buses.length > 0 && (
                          <div className="p-2">
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Buses</div>
                            {searchResults.buses.map((bus) => (
                              <button
                                key={bus.id}
                                onClick={() => handleNavigateToResult('buses', bus)}
                                className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 flex items-center gap-2"
                              >
                                <Bus size={14} className="text-gray-400" />
                                <span className="font-medium">{bus.name}</span>
                                <span className={`inline-flex px-1.5 py-0.5 text-xs rounded-full ${
                                  bus.status === 'active' ? 'bg-green-100 text-green-800' :
                                  bus.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {bus.status}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Routes section */}
                        {searchResults.routes.length > 0 && (
                          <div className="p-2">
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Routes</div>
                            {searchResults.routes.map((route) => (
                              <button
                                key={route.id}
                                onClick={() => handleNavigateToResult('routes', route)}
                                className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 flex items-center gap-2"
                              >
                                <Route size={14} className="text-gray-400" />
                                <div>
                                  <span className="font-medium">{route.name}</span>
                                  <span className="text-gray-500 ml-2">({route.code})</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Stations section */}
                        {searchResults.stations.length > 0 && (
                          <div className="p-2">
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Stations</div>
                            {searchResults.stations.map((station) => (
                              <button
                                key={station.id}
                                onClick={() => handleNavigateToResult('stations', station)}
                                className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 flex items-center gap-2"
                              >
                                <MapPin size={14} className="text-gray-400" />
                                <div>
                                  <span className="font-medium">{station.name}</span>
                                  <span className="text-gray-500 ml-2">({station.code})</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* No results */}
                        {searchResults.buses.length === 0 && 
                         searchResults.routes.length === 0 && 
                         searchResults.stations.length === 0 && (
                          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                            No results found for "{searchQuery}"
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications)
                  setShowUserMenu(false)
                }}
                className="relative p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>

              {/* Notifications dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notificationsLoading ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mx-auto mb-2"></div>
                        Loading notifications...
                      </div>
                    ) : notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div 
                          key={notification.id} 
                          className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${!notification.is_read ? 'bg-blue-50' : ''}`}
                          onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              notification.type === 'error' ? 'bg-red-500' :
                              notification.type === 'warning' ? 'bg-yellow-500' :
                              notification.type === 'success' ? 'bg-green-500' :
                              'bg-gray-400'
                            }`}></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                              <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(notification.createdAt).toLocaleString()}
                              </p>
                            </div>
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-sm text-gray-500">
                        No notifications
                      </div>
                    )}
                  </div>
                  <div className="p-4 border-t border-gray-200">
                    <button className="text-sm text-primary-600 hover:text-primary-800 font-medium">
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowUserMenu(!showUserMenu)
                  setShowNotifications(false)
                }}
                className="flex items-center gap-2 p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg"
              >
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-medium text-sm">
                    {user?.fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </button>

              {/* User dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {user?.fullName || user?.email}
                    </p>
                    <p className="text-xs text-gray-500">{user?.role}</p>
                  </div>
                  <div className="py-2">
                    <Link to="/settings" onClick={() => setShowUserMenu(false)} className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                      <User size={16} />
                      Profile
                    </Link>
                    <button onClick={handleNavigateToSettings} className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                      <Settings size={16} />
                      Settings
                    </button>
                  </div>
                  <div className="border-t border-gray-200 py-2">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
