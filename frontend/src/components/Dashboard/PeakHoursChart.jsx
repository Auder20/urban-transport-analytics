import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { Clock, TrendingUp, Users } from 'lucide-react'

export function PeakHoursChart({ data = [], height = 300 }) {
  if (!data || data.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Peak Hours Analysis</h3>
        <div className="flex items-center justify-center h-64 text-gray-400">
          <p>No peak hours data available</p>
        </div>
      </div>
    )
  }

  // Transform data for better visualization
  const chartData = data.map(hour => ({
    hour: `${hour.hour}:00`,
    hourNum: hour.hour,
    trips: hour.trip_count || 0,
    avgDelay: parseFloat(hour.average_delay || 0).toFixed(1),
    passengers: parseFloat(hour.average_passengers || 0).toFixed(1),
    isPeakHour: hour.hour >= 7 && hour.hour <= 9 || hour.hour >= 17 && hour.hour <= 19
  }))

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          <p className="text-sm text-blue-600">
            Trips: {data.trips}
          </p>
          <p className="text-sm text-orange-600">
            Avg Delay: {data.avgDelay} min
          </p>
          <p className="text-sm text-purple-600">
            Avg Passengers: {data.passengers}
          </p>
          {data.isPeakHour && (
            <p className="text-xs text-red-600 mt-1">
              Peak Hour
            </p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Peak Hours Analysis</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Trips</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span>Avg Delay</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="hour" 
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis 
            yAxisId="left"
            stroke="#6b7280"
            fontSize={12}
            label={{ value: 'Trips', angle: -90, position: 'insideLeft' }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="#6b7280"
            fontSize={12}
            label={{ value: 'Delay (min)', angle: 90, position: 'insideRight' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            yAxisId="left"
            dataKey="trips" 
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            yAxisId="right"
            dataKey="avgDelay" 
            fill="#f59e0b"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function PassengerFlowChart({ data = [], height = 300 }) {
  if (!data || data.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Passenger Flow</h3>
        <div className="flex items-center justify-center h-64 text-gray-400">
          <p>No passenger data available</p>
        </div>
      </div>
    )
  }

  // Transform data
  const chartData = data.map(hour => ({
    hour: `${hour.hour}:00`,
    passengers: parseFloat(hour.average_passengers || 0),
    trips: hour.trip_count || 0,
    isPeakHour: hour.hour >= 7 && hour.hour <= 9 || hour.hour >= 17 && hour.hour <= 19
  }))

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          <p className="text-sm text-purple-600">
            Avg Passengers: {data.passengers}
          </p>
          <p className="text-sm text-blue-600">
            Total Trips: {data.trips}
          </p>
          {data.isPeakHour && (
            <p className="text-xs text-red-600 mt-1">
              Peak Hour
            </p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Passenger Flow by Hour</h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Users size={14} />
          <span>Average passengers per trip</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="hour" 
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            label={{ value: 'Passengers', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone"
            dataKey="passengers" 
            stroke="#8b5cf6"
            fill="#8b5cf6"
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function PeakHoursSummary({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Peak Hours Summary</h3>
        <div className="flex items-center justify-center h-32 text-gray-400">
          <p>No peak hours data available</p>
        </div>
      </div>
    )
  }

  // Calculate peak hours statistics
  const peakHours = data.filter(hour => 
    hour.hour >= 7 && hour.hour <= 9 || hour.hour >= 17 && hour.hour <= 19
  )
  
  const offPeakHours = data.filter(hour => 
    !(hour.hour >= 7 && hour.hour <= 9 || hour.hour >= 17 && hour.hour <= 19)
  )

  const peakStats = {
    totalTrips: peakHours.reduce((sum, h) => sum + (h.trip_count || 0), 0),
    avgDelay: peakHours.reduce((sum, h) => sum + (h.average_delay || 0), 0) / peakHours.length,
    avgPassengers: peakHours.reduce((sum, h) => sum + (h.average_passengers || 0), 0) / peakHours.length,
  }

  const offPeakStats = {
    totalTrips: offPeakHours.reduce((sum, h) => sum + (h.trip_count || 0), 0),
    avgDelay: offPeakHours.reduce((sum, h) => sum + (h.average_delay || 0), 0) / offPeakHours.length,
    avgPassengers: offPeakHours.reduce((sum, h) => sum + (h.average_passengers || 0), 0) / offPeakHours.length,
  }

  // Find busiest hour
  const busiestHour = data.reduce((max, hour) => 
    (hour.trip_count || 0) > (max.trip_count || 0) ? hour : max
  , data[0])

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold mb-6">Peak Hours Summary</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Peak Hours Stats */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} className="text-orange-500" />
            <h4 className="font-medium">Peak Hours (7-9 AM, 5-7 PM)</h4>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Trips</span>
              <span className="font-medium">{peakStats.totalTrips.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Average Delay</span>
              <span className="font-medium text-orange-600">
                {peakStats.avgDelay.toFixed(1)} min
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Avg Passengers</span>
              <span className="font-medium">{peakStats.avgPassengers.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* Off-Peak Hours Stats */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-green-500" />
            <h4 className="font-medium">Off-Peak Hours</h4>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Trips</span>
              <span className="font-medium">{offPeakStats.totalTrips.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Average Delay</span>
              <span className="font-medium text-green-600">
                {offPeakStats.avgDelay.toFixed(1)} min
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Avg Passengers</span>
              <span className="font-medium">{offPeakStats.avgPassengers.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Busiest Hour */}
      {busiestHour && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Busiest Hour</p>
              <p className="text-lg font-bold text-blue-900">
                {busiestHour.hour}:00 - {busiestHour.trip_count} trips
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Avg Delay</p>
              <p className="font-medium text-orange-600">
                {parseFloat(busiestHour.average_delay || 0).toFixed(1)} min
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
