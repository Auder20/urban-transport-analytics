import { Routes, Route, Navigate } from 'react-router-dom'
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

function App() {
  const { user } = useAppStore()

  // Protected route wrapper
  const ProtectedRoute = ({ children }) => {
    if (!user) {
      return <Navigate to="/login" replace />
    }
    return children
  }

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
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
