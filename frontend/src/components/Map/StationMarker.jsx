import { Marker, Popup } from 'react-leaflet'
import { Icon, DivIcon } from 'leaflet'
import { MapPin, Clock, Users, Info } from 'lucide-react'

// Custom station icon
const createStationIcon = (type = 'stop', color = '#3b82f6', size = 'normal') => {
  const iconSize = size === 'small' ? [20, 20] : [28, 28]
  const iconAnchor = size === 'small' ? [10, 10] : [14, 14]
  
  const getStationIcon = (type) => {
    switch (type) {
      case 'terminal':
        return '🚌'
      case 'hub':
        return '🔄'
      default:
        return '📍'
    }
  }

  return new DivIcon({
    html: `
      <div style="
        background-color: white;
        width: ${iconSize[0]}px;
        height: ${iconSize[1]}px;
        border-radius: 50%;
        border: 3px solid ${color};
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        font-size: ${size === 'small' ? '10px' : '14px'};
      ">
        ${getStationIcon(type)}
      </div>
    `,
    className: 'custom-station-marker',
    iconSize,
    iconAnchor,
    popupAnchor: [0, -iconSize[1] / 2]
  })
}

export default function StationMarker({ station, routeColor = '#3b82f6', size = 'normal' }) {
  const [icon, setIcon] = useState(() => createStationIcon(station.type, routeColor, size))

  // Update icon when station or route changes
  if (icon.options.html.includes(routeColor) === false || 
      icon.options.html.includes(getStationIcon(station.type)) === false) {
    setIcon(createStationIcon(station.type, routeColor, size))
  }

  const getStationTypeColor = (type) => {
    switch (type) {
      case 'terminal':
        return '#dc2626' // Red
      case 'hub':
        return '#7c3aed' // Purple
      default:
        return '#3b82f6' // Blue
    }
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown'
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getStationTypeName = (type) => {
    switch (type) {
      case 'terminal':
        return 'Terminal'
      case 'hub':
        return 'Hub'
      default:
        return 'Stop'
    }
  }

  return (
    <Marker
      position={[station.location.lat, station.location.lng]}
      icon={icon}
    >
      <Popup>
        <div className="p-3 min-w-[220px]">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-800">{station.name}</h4>
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getStationTypeColor(station.type) }}
            ></div>
          </div>

          {/* Station type and code */}
          <div className="mb-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                {getStationTypeName(station.type)}
              </span>
              {station.stationCode && (
                <span className="text-gray-500">Code: {station.stationCode}</span>
              )}
            </div>
          </div>

          {/* Address */}
          {station.address && (
            <div className="mb-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin size={12} />
                <span>{station.address}</span>
              </div>
            </div>
          )}

          {/* Amenities */}
          {station.amenities && Object.keys(station.amenities).length > 0 && (
            <div className="mb-2">
              <p className="text-xs text-gray-500 mb-1">Amenities:</p>
              <div className="flex flex-wrap gap-1">
                {Object.entries(station.amenities).map(([key, value]) => (
                  value && (
                    <span key={key} className="px-1 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">
                      {key}
                    </span>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Stop order info */}
          {station.stopOrder !== undefined && (
            <div className="mb-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Stop #{station.stopOrder}</span>
                {station.distanceFromStartKm && (
                  <span className="text-gray-500">
                    ({station.distanceFromStartKm} km from start)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Average travel time */}
          {station.avgTravelTimeMin && (
            <div className="mb-2 text-sm">
              <div className="flex items-center gap-2">
                <Clock size={12} className="text-gray-400" />
                <span className="text-gray-600">
                  Avg travel time: {station.avgTravelTimeMin} min
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-3 pt-2 border-t border-gray-200">
            <div className="flex gap-2">
              <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                View Arrivals →
              </button>
              <button className="text-xs text-gray-600 hover:text-gray-800 font-medium">
                Details →
              </button>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  )
}

// Station with arrival information
export function StationWithArrivals({ station, arrivals = [], routeColor = '#3b82f6' }) {
  const [icon, setIcon] = useState(() => createStationIcon(station.type, routeColor))

  const getNextArrival = () => {
    if (!arrivals || arrivals.length === 0) return null
    return arrivals.reduce((next, arrival) => {
      if (!next || new Date(arrival.estimatedArrival) < new Date(next.estimatedArrival)) {
        return arrival
      }
      return next
    })
  }

  const nextArrival = getNextArrival()
  const hasArrivals = arrivals && arrivals.length > 0

  return (
    <Marker
      position={[station.location.lat, station.location.lng]}
      icon={icon}
    >
      <Popup>
        <div className="p-3 min-w-[250px]">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-800">{station.name}</h4>
            <div className="flex items-center gap-2">
              {hasArrivals && (
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              )}
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getStationTypeColor(station.type) }}
              ></div>
            </div>
          </div>

          {/* Next arrivals */}
          {hasArrivals ? (
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-700 mb-2">Next Arrivals:</p>
              <div className="space-y-2">
                {arrivals.slice(0, 3).map((arrival, index) => (
                  <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: arrival.route.color }}
                      ></div>
                      <span className="font-medium">{arrival.route.code}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-800">
                        {formatTime(arrival.estimatedArrival)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Bus {arrival.bus.plateNumber}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-3 p-3 bg-gray-50 rounded text-center text-sm text-gray-500">
              No arrivals in the next 30 minutes
            </div>
          )}

          {/* Station info */}
          <div className="text-xs text-gray-600">
            <div>Type: {getStationTypeName(station.type)}</div>
            {station.stopOrder !== undefined && (
              <div>Stop #{station.stopOrder}</div>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  )
}

function getStationTypeColor(type) {
  switch (type) {
    case 'terminal':
      return '#dc2626'
    case 'hub':
      return '#7c3aed'
    default:
      return '#3b82f6'
  }
}

function getStationTypeName(type) {
  switch (type) {
    case 'terminal':
      return 'Terminal'
    case 'hub':
      return 'Hub'
    default:
      return 'Stop'
  }
}

function formatTime(timestamp) {
  if (!timestamp) return 'Unknown'
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
