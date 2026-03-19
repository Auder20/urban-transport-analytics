import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopNav from './TopNav'

export default function PageLayout() {
  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      {/* Sidebar - hidden on mobile, visible on desktop */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <Sidebar />
      </div>
      
      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        <TopNav />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
      
      {/* Mobile sidebar overlay */}
      <div className="lg:hidden">
        <Sidebar />
      </div>
    </div>
  )
}

// Layout for full-screen pages (like maps)
export function FullScreenLayout({ title, children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="lg:hidden">
        {/* Mobile header */}
        <TopNav title={title} />
      </div>
      <div className="relative">
        {/* Desktop overlay */}
        <div className="hidden lg:block absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-md px-4 py-2">
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>
        
        {/* Main content */}
        {children}
      </div>
    </div>
  )
}

// Layout for analytics pages
export function AnalyticsLayout({ title, children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:pl-64">
        <TopNav title={title} />
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
