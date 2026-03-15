import { Polyline, Tooltip } from 'react-leaflet'
import { useState } from 'react'

export default function RoutePolyline({ route, isSelected = false, opacity = 0.8, onClick }) {
  // Generate waypoints from stations (mock data for now)
  // In a real app, this would come from the route data
  const waypoints = generateRouteWaypoints(route)

  const [isHovered, setIsHovered] = useState(false)

  const handleClick = () => {
    if (onClick) {
      onClick(route)
    }
  }

  const handleMouseOver = () => {
    setIsHovered(true)
  }

  const handleMouseOut = () => {
    setIsHovered(false)
  }

  const routeColor = route.color || '#3b82f6'
  const weight = isSelected ? 6 : isHovered ? 5 : 3
  const currentOpacity = isSelected ? 1 : opacity

  return (
    <>
      <Polyline
        positions={waypoints}
        color={routeColor}
        weight={weight}
        opacity={currentOpacity}
        smoothFactor={1}
        onClick={handleClick}
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
        style={{
          cursor: onClick ? 'pointer' : 'default',
          transition: 'weight 0.2s, opacity 0.2s'
        }}
      />
      
      {/* Tooltip showing route info */}
      <Tooltip permanent={false} direction="center">
        <div className="text-center">
          <div className="font-semibold">{route.name}</div>
          <div className="text-xs text-gray-600">
            {route.totalStops || 0} stops • {route.distanceKm ? `${route.distanceKm} km` : 'Unknown distance'}
          </div>
        </div>
      </Tooltip>
    </>
  )
}

// Generate mock waypoints for route visualization
function generateRouteWaypoints(route) {
  // In a real application, this would use actual station coordinates
  // For now, we'll generate a simple route pattern
  
  if (!route.stations || route.stations.length === 0) {
    // Generate a simple circular route around Bogotá
    const centerLat = 4.7110
    const centerLng = -74.0721
    const radius = 0.05 // ~5km radius
    
    const waypoints = []
    const points = 20 // Number of points in the route
    
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * 2 * Math.PI
      const lat = centerLat + radius * Math.cos(angle)
      const lng = centerLng + radius * Math.sin(angle)
      waypoints.push([lat, lng])
    }
    
    return waypoints
  }

  // Use actual station coordinates if available
  return route.stations
    .filter(station => station.location && station.location.lat && station.location.lng)
    .sort((a, b) => (a.stopOrder || 0) - (b.stopOrder || 0))
    .map(station => [station.location.lat, station.location.lng])
}

// Animated route polyline for selected routes
export function AnimatedRoutePolyline({ route, isSelected = false }) {
  const waypoints = generateRouteWaypoints(route)
  const routeColor = route.color || '#3b82f6'
  
  return (
    <>
      {/* Main route line */}
      <Polyline
        positions={waypoints}
        color={routeColor}
        weight={isSelected ? 6 : 3}
        opacity={isSelected ? 1 : 0.6}
        smoothFactor={1}
        dashArray={isSelected ? '10, 5' : undefined}
      />
      
      {/* Animated dash effect for selected routes */}
      {isSelected && (
        <Polyline
          positions={waypoints}
          color="white"
          weight={2}
          opacity={0.8}
          smoothFactor={1}
          dashArray="5, 10"
          className="animate-pulse"
        />
      )}
    </>
  )
}

// Route with direction indicators
export function DirectionalRoutePolyline({ route, showDirection = true }) {
  const waypoints = generateRouteWaypoints(route)
  const routeColor = route.color || '#3b82f6'
  
  return (
    <>
      <Polyline
        positions={waypoints}
        color={routeColor}
        weight={4}
        opacity={0.8}
        smoothFactor={1}
      />
      
      {/* Direction arrows */}
      {showDirection && waypoints.length > 1 && (
        <>
          {waypoints
            .filter((_, index) => index % 5 === 0) // Show arrows every 5 points
            .map((position, index) => {
              if (index === 0) return null
              
              const prevPoint = waypoints[index - 1]
              const angle = Math.atan2(
                position[0] - prevPoint[0],
                position[1] - prevPoint[1]
              ) * (180 / Math.PI)
              
              return (
                <div
                  key={index}
                  style={{
                    position: 'absolute',
                    transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                    left: '50%',
                    top: '50%',
                    fontSize: '12px',
                    color: routeColor,
                    fontWeight: 'bold'
                  }}
                >
                  ▶
                </div>
              )
            })}
        </>
      )}
    </>
  )
}
