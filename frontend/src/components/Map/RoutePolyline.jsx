import { Polyline, Tooltip } from 'react-leaflet'
import { useState } from 'react'
import { useRouteStations } from '@/hooks/useRoutes'

export default function RoutePolyline({ route, isSelected = false, opacity = 0.8, onClick }) {
  const [isHovered, setIsHovered] = useState(false)

  // Cargar estaciones reales de la ruta desde el backend
  const { data: stationsData } = useRouteStations(route.id)

  const waypoints = buildWaypoints(route, stationsData?.stations)

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
        eventHandlers={{
          click: () => onClick && onClick(route),
          mouseover: () => setIsHovered(true),
          mouseout: () => setIsHovered(false),
        }}
      />
      <Tooltip permanent={false} direction="center">
        <div className="text-center">
          <div className="font-semibold">{route.name}</div>
          <div className="text-xs text-gray-600">
            {route.totalStops || stationsData?.stations?.length || 0} paradas
            {route.distanceKm ? ` • ${route.distanceKm} km` : ''}
          </div>
        </div>
      </Tooltip>
    </>
  )
}

/**
 * Construye el array de coordenadas [[lat, lng], ...] para la polilínea.
 * Usa las estaciones reales del backend si están disponibles,
 * o una ruta de fallback mínima centrada en Medellín si no.
 */
function buildWaypoints(route, stations) {
  if (stations && stations.length >= 2) {
    return stations
      .filter(s => s.location?.lat && s.location?.lng)
      .sort((a, b) => (a.stopOrder || 0) - (b.stopOrder || 0))
      .map(s => [s.location.lat, s.location.lng])
  }

  // Fallback: línea corta distinta para cada ruta basada en su código
  // Evita que todas las rutas aparezcan como el mismo círculo
  const routeIndex = parseInt((route.routeCode || route.route_code || 'R001').replace(/\D/g, '')) || 1
  const centerLat = 6.2442
  const centerLng = -75.5812
  const angle = ((routeIndex - 1) / 10) * 2 * Math.PI
  const radius = 0.04 + (routeIndex % 3) * 0.015

  const points = 12
  return Array.from({ length: points + 1 }, (_, i) => {
    const a = angle + (i / points) * 1.5 * Math.PI
    return [
      centerLat + radius * Math.cos(a),
      centerLng + radius * Math.sin(a),
    ]
  })
}

// Polilínea animada para rutas seleccionadas
export function AnimatedRoutePolyline({ route, isSelected = false }) {
  const { data: stationsData } = useRouteStations(route.id)
  const waypoints = buildWaypoints(route, stationsData?.stations)
  const routeColor = route.color || '#3b82f6'

  return (
    <>
      <Polyline
        positions={waypoints}
        color={routeColor}
        weight={isSelected ? 6 : 3}
        opacity={isSelected ? 1 : 0.6}
        smoothFactor={1}
        dashArray={isSelected ? '10, 5' : undefined}
      />
      {isSelected && (
        <Polyline
          positions={waypoints}
          color="white"
          weight={2}
          opacity={0.8}
          smoothFactor={1}
          dashArray="5, 10"
        />
      )}
    </>
  )
}

// Polilínea con indicadores de dirección
export function DirectionalRoutePolyline({ route }) {
  const { data: stationsData } = useRouteStations(route.id)
  const waypoints = buildWaypoints(route, stationsData?.stations)
  const routeColor = route.color || '#3b82f6'

  return (
    <Polyline
      positions={waypoints}
      color={routeColor}
      weight={4}
      opacity={0.8}
      smoothFactor={1}
    />
  )
}