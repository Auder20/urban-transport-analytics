import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet'
import { useEffect, useState } from 'react'
import { useBusLocations } from '@/hooks/useBusLocations'
import { useRoutes } from '@/hooks/useRoutes'
import { useAppStore } from '@/store/useAppStore'
import BusMarker from './BusMarker'
import RoutePolyline from './RoutePolyline'
import StationMarker from './StationMarker'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

export default function TransportMap({ height = '100vh' }) {
  const { buses, isLoading: busesLoading } = useBusLocations(5000) // poll every 5s
  const { data: routesData, isLoading: routesLoading } = useRoutes(1, 50) // Get all routes
  const { selectedRoute, mapCenter, mapZoom } = useAppStore()
  
  const [map, setMap] = useState(null)

  // Update map when center/zoom changes
  useEffect(() => {
    if (map && mapCenter && mapZoom) {
      map.setView(mapCenter, mapZoom)
    }
  }, [map, mapCenter, mapZoom])

  // Filter routes based on selection
  const routes = routesData?.routes || []
  const displayRoutes = selectedRoute 
    ? routes.filter(r => r.id === selectedRoute.id)
    : routes

  return (
    <div className="relative" style={{ height }}>
      {/* Loading overlay */}
      {(busesLoading || routesLoading) && (
        <div className="absolute top-4 left-4 z-[1000] bg-white px-3 py-2 rounded-lg shadow-md">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm">Loading map data...</span>
          </div>
        </div>
      )}

      {/* Map controls info */}
      <div className="absolute top-4 right-4 z-[1000] bg-white px-3 py-2 rounded-lg shadow-md">
        <div className="text-xs text-gray-600 space-y-1">
          <div>🚌 {buses?.length || 0} buses active</div>
          <div>🛣️ {displayRoutes.length} routes shown</div>
        </div>
      </div>

      <MapContainer 
        center={mapCenter} 
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        ref={setMap}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Route polylines */}
        {routes.map(route => (
          <RoutePolyline
            key={route.id}
            route={route}
            isSelected={selectedRoute?.id === route.id}
            onClick={() => useAppStore.getState().setSelectedRoute(route)}
          />
        ))}

        {/* Station markers */}
        {displayRoutes.map(route => (
          route.stations?.map(station => (
            <StationMarker
              key={station.id}
              station={station}
              routeColor={route.color}
            />
          ))
        ))}

        {/* Bus markers */}
        {buses?.map(bus => (
          <BusMarker 
            key={bus.id} 
            bus={bus}
            isHighlighted={selectedRoute ? bus.currentRoute?.id === selectedRoute.id : true}
          />
        ))}
      </MapContainer>
    </div>
  )
}

// Simple map component for dashboard preview
export function MiniMap({ height = 300 }) {
  const { buses } = useBusLocations(10000) // less frequent updates
  const { data: routesData } = useRoutes(1, 10) // Limited routes

  const routes = routesData?.routes || []
  const center = [4.7110, -74.0721] // Bogotá

  return (
    <div className="card p-4">
      <h3 className="text-lg font-semibold mb-4">Live Map</h3>
      <div className="rounded-lg overflow-hidden border border-gray-200" style={{ height }}>
        <MapContainer center={center} zoom={11} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Show only first 3 routes for performance */}
          {routes.slice(0, 3).map(route => (
            <RoutePolyline
              key={route.id}
              route={route}
              isSelected={false}
              opacity={0.6}
            />
          ))}

          {/* Bus markers */}
          {buses?.slice(0, 20).map(bus => (
            <BusMarker 
              key={bus.id} 
              bus={bus}
              isHighlighted={false}
              size="small"
            />
          ))}
        </MapContainer>
      </div>
      
      <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
        <span>🚌 {buses?.length || 0} buses active</span>
        <span>🛣️ {Math.min(routes.length, 3)} routes shown</span>
      </div>
    </div>
  )
}
