import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { AlertTriangle, TrendingUp, Clock } from 'lucide-react'
import { CHART_COLORS, DELAY_COLORS } from '@/constants/chartColors'

export function RoutePerformance({ data = [], height = 400, isLoading = false }) {
  if (isLoading) {
    return (
      <div className="card p-6 animate-pulse">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-56 mb-6"></div>
        <div className="bg-gray-100 dark:bg-gray-700 rounded" style={{ height }}></div>
      </div>
    )
  }
  if (!data || data.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Route Performance</h3>
        <div className="flex items-center justify-center h-64 text-gray-400">
          <p>No route performance data available</p>
        </div>
      </div>
    )
  }

  // Transform data and limit to top 10
  const chartData = data
    .slice(0, 10)
    .map(route => ({
      name: route.route_code || route.name || 'Unknown',
      avgDelay: parseFloat(route.average_delay || 0).toFixed(1),
      onTime: parseFloat(route.on_time_percentage || 0).toFixed(1),
      totalTrips: route.total_trips || 0,
      color: route.color || '#3b82f6'
    }))

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 p-3 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 dark:text-gray-100 mb-2">{label}</p>
          <p className="text-sm text-orange-600">
            Avg Delay: {data.avgDelay} min
          </p>
          <p className="text-sm text-green-600">
            On Time: {data.onTime}%
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Trips: {data.totalTrips}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Routes with Highest Delays</h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <AlertTriangle size={14} className="text-orange-500" />
          <span>Average delay (minutes)</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 50, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={80}
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            label={{ value: 'Average Delay (min)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="avgDelay" 
            fill={CHART_COLORS.warning}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function RoutePerformanceTable({ data = [], limit = 10 }) {
  if (!data || data.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Route Performance Details</h3>
        <div className="flex items-center justify-center h-32 text-gray-400">
          <p>No route data available</p>
        </div>
      </div>
    )
  }

  const getStatusColor = (delay) => {
    if (delay > 20) return 'text-danger-600 bg-danger-50'
    if (delay > 10) return 'text-warning-600 bg-warning-50'
    if (delay > 5) return 'text-primary-600 bg-primary-50'
    return 'text-success-600 bg-success-50'
  }

  const getStatusIcon = (delay) => {
    if (delay > 15) return <AlertTriangle size={14} className="text-danger-500" />
    if (delay > 8) return <Clock size={14} className="text-warning-500" />
    return <TrendingUp size={14} className="text-success-500" />
  }

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold mb-6">Route Performance Details</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-700">Route</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Avg Delay</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">On Time %</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Total Trips</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, limit).map((route, index) => (
              <tr key={route.id || index} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: route.color || '#3b82f6' }}
                    ></div>
                    <span className="font-medium">{route.route_code || route.name}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="font-medium">
                    {parseFloat(route.average_delay || 0).toFixed(1)} min
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {parseFloat(route.on_time_percentage || 0).toFixed(1)}%
                    </span>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full"
                        style={{
                          width: `${Math.min(100, route.on_time_percentage || 0)}%`,
                          backgroundColor: route.on_time_percentage >= 80 ? DELAY_COLORS.good :
                                         route.on_time_percentage >= 60 ? DELAY_COLORS.warning : DELAY_COLORS.critical
                        }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-600">
                  {route.total_trips || 0}
                </td>
                <td className="py-3 px-4">
                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(route.average_delay || 0)}`}>
                    {getStatusIcon(route.average_delay || 0)}
                    <span>
                      {route.average_delay > 15 ? 'Critical' : 
                       route.average_delay > 8 ? 'Warning' : 'Good'}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
