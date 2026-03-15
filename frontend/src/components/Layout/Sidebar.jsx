import { NavLink, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Map, 
  Route, 
  FileText, 
  Settings, 
  LogOut,
  Menu,
  X,
  Bus,
  BarChart3
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { clsx } from 'clsx'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Live Map', href: '/map', icon: Map },
  { name: 'Routes', href: '/routes', icon: Route },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen, user, logout } = useAppStore()
  const location = useLocation()

  const handleLogout = () => {
    logout()
  }

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={clsx(
        'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex h-full flex-col">
          {/* Logo and close button */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Bus size={20} className="text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900">UTA</span>
            </div>
            
            {/* Mobile close button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>

          {/* User info */}
          {user && (
            <div className="px-4 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-medium">
                    {user.fullName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.fullName || user.email}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user.role}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={clsx(
                    'group flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700 border-primary-200'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <item.icon
                    size={18}
                    className={clsx(
                      'flex-shrink-0',
                      isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                    )}
                  />
                  <span>{item.name}</span>
                </NavLink>
              )
            })}
          </nav>

          {/* Analytics section */}
          <div className="px-4 py-4 border-t border-gray-200">
            <div className="mb-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Analytics</p>
            </div>
            <NavLink
              to="/analytics"
              onClick={() => setSidebarOpen(false)}
              className={clsx(
                'group flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                location.pathname.startsWith('/analytics')
                  ? 'bg-primary-50 text-primary-700 border-primary-200'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <BarChart3
                size={18}
                className={clsx(
                  'flex-shrink-0',
                  location.pathname.startsWith('/analytics') ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                )}
              />
              <span>Advanced Analytics</span>
            </NavLink>
          </div>

          {/* Footer */}
          <div className="px-4 py-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <LogOut size={18} className="text-gray-400" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// Mobile menu button
export function MobileMenuButton() {
  const { sidebarOpen, setSidebarOpen } = useAppStore()

  return (
    <button
      onClick={() => setSidebarOpen(true)}
      className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
    >
      <Menu size={20} />
    </button>
  )
}
