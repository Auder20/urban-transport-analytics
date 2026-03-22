import { useState, useCallback, useEffect } from 'react'
import TransportMap from '@/components/Map/TransportMap'
import { FullScreenLayout } from '@/components/Layout/PageLayout'
import { useBusLocations } from '@/hooks/useBusLocations'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useRoutes } from '@/hooks/useRoutes'
import { useAppStore } from '@/store/useAppStore'
import { Filter, Layers, Maximize2, Minimize2 } from 'lucide-react'

export default function LiveMap() {
  const { buses, isLoading: busesLoading } = useBusLocations(30000) // Reduced frequency, WebSocket handles real-time updates
  const { data: routesData, isLoading: routesLoading } = useRoutes(1, 100)
  const { 
    selectedRoute, 
    setSelectedRoute, 
    sidebarOpen,
    filterStatus,
    filterOccupancy,
    setFilterStatus,
    setFilterOccupancy
  } = useAppStore()
  const [showFilters, setShowFilters] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [liveBuses, setLiveBuses] = useState({})

  // WebSocket connection for real-time bus updates
  const handleBusUpdate = useCallback((data) => {
    setLiveBuses(prev => ({
      ...prev,
      [data.busId]: {
        ...prev[data.busId],
        lat: data.lat,
        lng: data.lng,
        speed: data.speed,
        timestamp: data.timestamp
      }
    }))
  }, [])

  const { socket } = useWebSocket()

  // Set up WebSocket listener for bus location updates
  useEffect(() => {
    if (!socket) return
    
    socket.on('bus:location:update', handleBusUpdate)
    
    return () => {
      socket.off('bus:location:update', handleBusUpdate)
    }
  }, [socket, handleBusUpdate])

  const routes = routesData?.routes || []
  const activeBuses = buses?.filter(bus => bus.status === 'active') || []

  // Filter buses based on filters
  const filteredBuses = activeBuses.filter(bus => {
    if (filterStatus !== 'all' && bus.status !== filterStatus) return false
    
    if (filterOccupancy !== 'all') {
      const occupancy = bus.location?.occupancyPct || 0
      if (filterOccupancy === 'low' && occupancy > 30) return false
      if (filterOccupancy === 'medium' && (occupancy <= 30 || occupancy > 70)) return false
      if (filterOccupancy === 'high' && occupancy <= 70) return false
    }
    
    return true
  })

  const handleRouteSelect = (route) => {
    setSelectedRoute(route.id === selectedRoute?.id ? null : route)
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  if (isFullscreen) {
    return (
      <FullScreenLayout title="Live Map">
        <div className="relative" style={{ height: '100vh' }}>
          {/* Fullscreen controls */}
          <div className="absolute top-4 right-4 z-[1000] flex gap-2">
            <button
              onClick={() => setIsFullscreen(false)}
              className="bg-white px-3 py-2 rounded-lg shadow-md hover:bg-gray-50 flex items-center gap-2"
            >
              <Minimize2 size={16} />
              Exit Fullscreen
            </button>
          </div>
          
          <TransportMap height="100vh" />
        </div>
      </FullScreenLayout>
    )
  }

  return (
    <div className="h-full">
      {/* Map controls */}
      <div className="absolute top-4 left-4 z-[1000] flex gap-2">
        {/* Route selector */}
        <div className="bg-white rounded-lg shadow-md p-3">
          <div className="flex items-center gap-2 mb-2">
            <Layers size={16} />
            <span className="text-sm font-medium">Routes</span>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            <button
              onClick={() => setSelectedRoute(null)}
              className={`w-full text-left px-2 py-1 text-sm rounded transition-colors ${
                !selectedRoute ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100'
              }`}
            >
              All Routes
            </button>
            {routes.map(route => (
              <button
                key={route.id}
                onClick={() => handleRouteSelect(route)}
                className={`w-full text-left px-2 py-1 text-sm rounded flex items-center gap-2 transition-colors ${
                  selectedRoute?.id === route.id ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100'
                }`}
              >
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: route.color }}
                ></div>
                {route.name}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm font-medium mb-2"
          >
            <Filter size={16} />
            Filters
          </button>
          
          {showFilters && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600 block mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              
              <div>
                <label className="text-xs text-gray-600 block mb-1">Occupancy</label>
                <select
                  value={filterOccupancy}
                  onChange={(e) => setFilterOccupancy(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                >
                  <option value="all">All</option>
                  <option value="low">Low (0-30%)</option>
                  <option value="medium">Medium (30-70%)</option>
                  <option value="high">High (70%+)</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map stats */}
      <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-md p-3">
        <div className="text-sm space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>{filteredBuses.length} buses active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>{selectedRoute ? '1' : routes.length} routes shown</span>
          </div>
        </div>
      </div>

      {/* Fullscreen button */}
      <div className="absolute bottom-4 right-4 z-[1000]">
        <button
          onClick={toggleFullscreen}
          className="bg-white px-3 py-2 rounded-lg shadow-md hover:bg-gray-50 flex items-center gap-2"
        >
          <Maximize2 size={16} />
          Fullscreen
        </button>
      </div>

      {/* Map */}
      <TransportMap height="calc(100vh - 73px)" />
    </div>
  )
}
