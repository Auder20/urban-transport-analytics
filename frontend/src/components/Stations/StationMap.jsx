import { useEffect, useRef } from 'react'
import { MapPin, Navigation, Users } from 'lucide-react'

export default function StationMap({ 
  stations, 
  selectedStation, 
  onStationSelect,
  centerCoords = [6.2442, -75.5812], // Medellín coordinates
  zoom = 12 
}) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])

  useEffect(() => {
    // Initialize map (simplified - in real implementation would use Leaflet)
    if (mapRef.current && !mapInstanceRef.current) {
      // This is a placeholder for Leaflet initialization
      console.log('Map would be initialized here with center:', centerCoords)
    }
  }, [])

  useEffect(() => {
    // Update markers when stations change
    if (mapInstanceRef.current && stations) {
      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove())
      markersRef.current = []

      // Add new markers
      stations.forEach(station => {
        if (station.latitude && station.longitude) {
          const marker = {
            id: station.id,
            position: [station.latitude, station.longitude],
            station: station
          }
          markersRef.current.push(marker)
        }
      })
    }
  }, [stations])

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981'
      case 'inactive': return '#ef4444'
      case 'maintenance': return '#f59e0b'
      default: return '#6b7280'
    }
  }

  // Placeholder map component - in real implementation would use actual map library
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Station Map</h2>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Navigation className="w-4 h-4" />
          <span>{stations?.length || 0} stations</span>
        </div>
      </div>

      {/* Placeholder for actual map */}
      <div 
        ref={mapRef}
        className="bg-gray-100 rounded-lg h-96 flex items-center justify-center border-2 border-dashed border-gray-300"
      >
        <div className="text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Interactive Map</h3>
          <p className="text-gray-600 mb-4">
            Map visualization would be rendered here using Leaflet
          </p>
          
          {/* Station list as fallback */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {stations?.slice(0, 6).map((station) => (
              <div
                key={station.id}
                onClick={() => onStationSelect(station)}
                className={`p-3 bg-white rounded-lg border cursor-pointer hover:border-blue-500 transition-colors ${
                  selectedStation?.id === station.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  <div 
                    className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                    style={{ backgroundColor: getStatusColor(station.status) }}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {station.name}
                    </h4>
                    <p className="text-xs text-gray-500 truncate">
                      {station.code}
                    </p>
                    {station.routes && (
                      <div className="flex items-center gap-1 mt-1">
                        <Users className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {station.routes.length} routes
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {stations?.length > 6 && (
            <p className="text-sm text-gray-500 mt-4">
              And {stations.length - 6} more stations...
            </p>
          )}
        </div>
      </div>

      {/* Map Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Active</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span>Inactive</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span>Maintenance</span>
        </div>
      </div>
    </div>
  )
}
