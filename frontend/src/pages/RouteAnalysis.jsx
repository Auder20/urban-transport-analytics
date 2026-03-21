import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useRoute, useRouteStations, useRouteBuses } from '@/hooks/useRoutes'
import { useRouteAnalysis, useDelayPrediction } from '@/hooks/useAnalytics'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { ArrowLeft, TrendingUp, Clock, Users, AlertTriangle, MapPin } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

export default function RouteAnalysis() {
  const { routeId } = useParams()
  const { setSelectedRoute } = useAppStore()
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('all')
  
  const { data: route, isLoading: routeLoading } = useRoute(routeId)
  const { data: stations, isLoading: stationsLoading } = useRouteStations(routeId)
  const { data: buses, isLoading: busesLoading } = useRouteBuses(routeId)
  const { data: analysis, isLoading: analysisLoading } = useRouteAnalysis(routeId)
  
  const { data: prediction } = useDelayPrediction(
    routeId ? {
      route_id: routeId,
      hour: new Date().getHours(),
      day_of_week: new Date().getDay()
    } : undefined
  )

  // Set selected route in global state
  useEffect(() => {
    if (route) {
      setSelectedRoute(route)
    }
  }, [route, setSelectedRoute])

  if (routeLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!route) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Route not found</p>
      </div>
    )
  }

  const performanceData = analysis ? [
    { metric: 'On Time', value: analysis.onTimePercentage, color: '#10b981' },
    { metric: 'Delayed', value: 100 - analysis.onTimePercentage, color: '#ef4444' },
  ] : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => window.history.back()}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <div 
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: route.color }}
          ></div>
          <div>
            <h1 className="text-2xl font-bold">{route.name}</h1>
            <p className="text-gray-600">{route.routeCode} • {route.totalStops} stops</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-green-500" />
            <span className="text-sm text-gray-600">On-Time Performance</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {analysis?.onTimePercentage?.toFixed(1) || 'N/A'}%
          </p>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-orange-500" />
            <span className="text-sm text-gray-600">Average Delay</span>
          </div>
          <p className="text-2xl font-bold text-orange-600">
            {analysis?.averageDelay?.toFixed(1) || 'N/A'} min
          </p>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-blue-500" />
            <span className="text-sm text-gray-600">Active Buses</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {buses?.length || 0}
          </p>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={16} className="text-purple-500" />
            <span className="text-sm text-gray-600">Total Trips</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">
            {analysis?.totalTrips?.toLocaleString() || 'N/A'}
          </p>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Performance Overview</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="metric" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill={(entry) => entry.color} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stations */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Route Stations</h3>
        <div className="space-y-2">
          {stations?.map((station, index) => (
            <div key={station.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-sm font-medium text-primary-600">
                  {station.stopOrder}
                </div>
                <div>
                  <p className="font-medium">{station.name}</p>
                  <p className="text-sm text-gray-500">{station.stationCode}</p>
                </div>
              </div>
              <div className="text-right text-sm text-gray-600">
                {station.distanceFromStartKm && (
                  <p>{station.distanceFromStartKm} km</p>
                )}
                {station.avgTravelTimeMin && (
                  <p>{station.avgTravelTimeMin} min</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Buses */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Active Buses</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {buses?.map((bus) => (
            <div key={bus.id} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{bus.plateNumber}</span>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Capacity: {bus.capacity}</p>
                <p>Model: {bus.model || 'N/A'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {analysis?.recommendations && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-orange-500" />
            Recommendations
          </h3>
          <ul className="space-y-2">
            {analysis.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <span className="text-gray-700">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Delay Prediction */}
      {prediction && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Current Delay Prediction</h3>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-blue-800">
              Predicted delay for current time: <strong>{prediction.predicted_delay_minutes?.toFixed(1)} minutes</strong>
            </p>
            {prediction.confidence_interval && (
              <p className="text-sm text-blue-600 mt-1">
                Confidence interval: {prediction.confidence_interval.lower?.toFixed(1)} - {prediction.confidence_interval.upper?.toFixed(1)} minutes
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
