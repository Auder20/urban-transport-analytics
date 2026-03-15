import { Marker, Popup } from 'react-leaflet'
import { Icon, DivIcon } from 'leaflet'
import { Bus, Users, Clock } from 'lucide-react'
import { useState } from 'react'

// Custom bus icon
const createBusIcon = (color = '#3b82f6', size = 'normal') => {
  const iconSize = size === 'small' ? [24, 24] : [32, 32]
  const iconAnchor = size === 'small' ? [12, 12] : [16, 16]
  
  return new DivIcon({
    html: `
      <div style="
        background-color: ${color};
        width: ${iconSize[0]}px;
        height: ${iconSize[1]}px;
        border-radius: 50%;
        border: 2px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        position: relative;
      ">
        <svg width="${size === 'small' ? 12 : 16}" height="${size === 'small' ? 12 : 16}" fill="white" viewBox="0 0 24 24">
          <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
        </svg>
        ${size === 'normal' ? `
          <div style="
            position: absolute;
            top: -8px;
            right: -8px;
            background: #10b981;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            border: 2px solid white;
          "></div>
        ` : ''}
      </div>
    `,
    className: 'custom-bus-marker',
    iconSize,
    iconAnchor,
    popupAnchor: [0, -iconSize[1] / 2]
  })
}

export default function BusMarker({ bus, isHighlighted = true, size = 'normal' }) {
  const [icon, setIcon] = useState(() => createBusIcon(bus.currentRoute?.color || '#3b82f6', size))

  // Update icon when bus changes
  if (icon.options.html.includes(bus.currentRoute?.color || '#3b82f6') === false) {
    setIcon(createBusIcon(bus.currentRoute?.color || '#3b82f6', size))
  }

  const getOccupancyColor = (occupancy) => {
    if (occupancy > 80) return '#ef4444' // Red
    if (occupancy > 60) return '#f59e0b' // Yellow
    return '#10b981' // Green
  }

  const getStatusColor = (status) => {
    if (status === 'active') return '#10b981'
    if (status === 'delayed') return '#f59e0b'
    return '#ef4444'
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown'
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <Marker
      position={[bus.location?.lat, bus.location?.lng]}
      icon={icon}
      opacity={isHighlighted ? 1 : 0.6}
    >
      <Popup>
        <div className="p-2 min-w-[200px]">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-800">Bus {bus.plateNumber}</h4>
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: getStatusColor(bus.status) }}
            ></div>
          </div>

          {/* Route info */}
          {bus.currentRoute && (
            <div className="mb-2 p-2 bg-gray-50 rounded">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: bus.currentRoute.color }}
                ></div>
                <span className="font-medium text-sm">{bus.currentRoute.code}</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">{bus.currentRoute.name}</p>
            </div>
          )}

          {/* Location and speed */}
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-gray-400" />
              <span className="text-gray-600">
                Last seen: {formatTime(bus.location.timestamp)}
              </span>
            </div>
            
            {bus.location.speedKmh && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400">⚡</span>
                <span className="text-gray-600">
                  Speed: {bus.location.speedKmh} km/h
                </span>
              </div>
            )}

            {bus.location.occupancyPct && (
              <div className="flex items-center gap-2">
                <Users size={14} className="text-gray-400" />
                <span className="text-gray-600">
                  Occupancy: {bus.location.occupancyPct}%
                </span>
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getOccupancyColor(bus.location.occupancyPct) }}
                ></div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-3 pt-2 border-t border-gray-200">
            <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
              View Details →
            </button>
          </div>
        </div>
      </Popup>
    </Marker>
  )
}

// Clustered bus marker for multiple buses in same area
export function BusClusterMarker({ buses, position }) {
  const count = buses.length
  const avgOccupancy = buses.reduce((sum, bus) => sum + (bus.location?.occupancyPct || 0), 0) / count

  const clusterIcon = new DivIcon({
    html: `
      <div style="
        background-color: #3b82f6;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 3px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        font-weight: bold;
        color: white;
        font-size: 14px;
      ">
        ${count}
      </div>
    `,
    className: 'bus-cluster-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  })

  return (
    <Marker position={position} icon={clusterIcon}>
      <Popup>
        <div className="p-2">
          <h4 className="font-semibold mb-2">Bus Cluster ({count} buses)</h4>
          <div className="space-y-1 text-sm">
            <p>Average occupancy: {avgOccupancy.toFixed(1)}%</p>
            <p className="text-gray-600">Click to zoom in and see individual buses</p>
          </div>
        </div>
      </Popup>
    </Marker>
  )
}
