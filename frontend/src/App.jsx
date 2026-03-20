import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
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

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { user } = useAppStore()
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return children
}

function App() {
  const { theme } = useAppStore()

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark')
    } else if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [theme])

  return (
    <div className="min-h-screen bg-gray-50">
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
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
          <Route path="buses" element={<BusesList />} />
          <Route path="stations" element={<StationsList />} />
          <Route path="trips" element={<TripsList />} />
          <Route path="schedules" element={<Schedules />} />
        </Route>
        
        <Route path="*" element={
          <div className="min-h-screen flex flex-col items-center justify-center gap-4">
            <h1 className="text-4xl font-bold text-gray-900">404</h1>
            <p className="text-gray-600">Esta página no existe.</p>
            <a href="/dashboard" className="btn btn-primary">Volver al dashboard</a>
          </div>
        } />
      </Routes>
    </div>
  )
}

export default App
