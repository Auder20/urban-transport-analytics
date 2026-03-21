import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import { CHART_COLORS, SERIES_COLORS } from '@/constants/chartColors'

export function DelayChart({ data, routes = [], height = 300, isLoading = false }) {
  if (isLoading) {
    return (
      <div className="card p-6 animate-pulse">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-6"></div>
        <div className="bg-gray-100 dark:bg-gray-700 rounded" style={{ height }}></div>
      </div>
    )
  }
  if (!data || data.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Average Delay by Hour</h3>
        <div className="flex items-center justify-center h-64 text-gray-400">
          <p>No delay data available</p>
        </div>
      </div>
    )
  }

  // Transform data for Recharts
  const chartData = data.map(item => ({
    hour: item.hour,
    delay: parseFloat(item.average_delay || 0).toFixed(1),
    trips: item.trip_count || 0,
  }))

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 p-3 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 dark:text-gray-100">{`${label}:00`}</p>
          <p className="text-sm text-primary-600">
            Avg Delay: {data.delay} min
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Trips: {data.trips}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Average Delay by Hour</h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
          <span>Delay (minutes)</span>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="hour" 
            tickFormatter={(value) => `${value}:00`}
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            label={{ value: 'Delay (min)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="delay" 
            stroke={CHART_COLORS.primary}
            strokeWidth={2}
            dot={{ fill: CHART_COLORS.primary, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function RouteDelayChart({ data, height = 300 }) {
  if (!data || data.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Route Comparison</h3>
        <div className="flex items-center justify-center h-64 text-gray-400">
          <p>No route data available</p>
        </div>
      </div>
    )
  }

  // Transform data for multiple routes
  const chartData = data.reduce((acc, item) => {
    const existingHour = acc.find(d => d.hour === item.hour)
    if (existingHour) {
      existingHour[item.route_code] = parseFloat(item.average_delay || 0).toFixed(1)
    } else {
      acc.push({
        hour: item.hour,
        [item.route_code]: parseFloat(item.average_delay || 0).toFixed(1)
      })
    }
    return acc
  }, [])

  // Get unique route codes for lines
  const routeCodes = [...new Set(data.map(item => item.route_code))]
  const colors = SERIES_COLORS

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 p-3 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 dark:text-gray-100 mb-2">{`${label}:00`}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value} min
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Route Delay Comparison</h3>
        <div className="flex items-center gap-4">
          {routeCodes.slice(0, 3).map((code, index) => (
            <div key={code} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: colors[index % colors.length] }}
              ></div>
              <span>{code}</span>
            </div>
          ))}
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="hour" 
            tickFormatter={(value) => `${value}:00`}
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            label={{ value: 'Delay (min)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {routeCodes.slice(0, 3).map((code, index) => (
            <Line
              key={code}
              type="monotone"
              dataKey={code}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
