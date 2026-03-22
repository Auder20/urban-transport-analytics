import { Routes, Route, Navigate, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { useAppStore } from '@/store/useAppStore'
import Layout from '@/components/Layout/PageLayout'
import Dashboard from '@/pages/Dashboard'
import LiveMap from '@/pages/LiveMap'
import RoutesList from '@/pages/RoutesList'
import RouteAnalysis from '@/pages/RouteAnalysis'
import Reports from '@/pages/Reports'
import Settings from '@/pages/Settings'
import Analytics from '@/pages/Analytics'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import BusesList from '@/pages/BusesList'
import StationsList from '@/pages/StationsList'
import TripsList from '@/pages/TripsList'
import Schedules from '@/pages/Schedules'
import NotificationsPage from '@/pages/NotificationsPage'

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { user } = useAppStore()
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return children
}

function App() {
  const { theme, token, setToken, setUser } = useAppStore()
  const [isInitializing, setIsInitializing] = useState(!token)

  // Silent refresh on app mount
  useEffect(() => {
    if (!token) {
      axios.post('/api/auth/refresh', {}, { withCredentials: true })
        .then(res => {
          setToken(res.data.accessToken)
          if (res.data.user) setUser(res.data.user)
        })
        .catch(() => {})
        .finally(() => setIsInitializing(false))
    }
  }, [])

  useEffect(() => {
  const applyTheme = (dark) => {
    if (dark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  if (theme === 'dark') {
    applyTheme(true)
  } else if (theme === 'light') {
    applyTheme(false)
  } else if (theme === 'auto') {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    applyTheme(mq.matches)
    const handler = (e) => applyTheme(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }
}, [theme])

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="map" element={<LiveMap />} />
          <Route path="routes" element={<RoutesList />} />
          <Route path="routes/:routeId" element={<RouteAnalysis />} />
          <Route path="reports" element={<Reports />} />
          <Route path="ml-insights" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
          <Route path="buses" element={<BusesList />} />
          <Route path="stations" element={<StationsList />} />
          <Route path="trips" element={<TripsList />} />
          <Route path="schedules" element={<Schedules />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>
        
        <Route path="*" element={
          <div className="min-h-screen flex flex-col items-center justify-center gap-4">
            <h1 className="text-4xl font-bold text-gray-900">404</h1>
            <p className="text-gray-600">Esta página no existe.</p>
            <Link to="/dashboard" className="btn btn-primary">Volver al dashboard</Link>
          </div>
        } />
      </Routes>
    </div>
  )
}

export default App
