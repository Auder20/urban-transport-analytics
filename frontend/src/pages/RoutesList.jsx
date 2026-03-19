import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Search, 
  Filter, 
  Route as RouteIcon, 
  MapPin, 
  Clock,
  Activity,
  ChevronRight,
  Eye
} from 'lucide-react'
import { useRoutes } from '@/hooks/useRoutes'

export default function RoutesList() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Fetch routes data using the correct hook
  const { data: routesData, isLoading, error } = useRoutes(1, 100, { 
    search: searchTerm, 
    status: statusFilter !== 'all' ? statusFilter : undefined 
  })

  // Extract routes array from the response
  const routes = routesData?.routes || []

  // Filter routes based on search and status (additional client-side filtering if needed)
  const filteredRoutes = routes.filter(route => {
    const matchesSearch = searchTerm === '' || 
      route.route_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || route.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'suspended':
        return 'bg-red-100 text-red-800'
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <Activity size={14} className="text-green-600" />
      case 'suspended':
        return <Activity size={14} className="text-red-600" />
      case 'maintenance':
        return <Activity size={14} className="text-yellow-600" />
      default:
        return <Activity size={14} className="text-gray-600" />
    }
  }

  if (error) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-3 text-red-600">
          <Filter size={20} />
          <span>Error loading routes: {error.message}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Routes</h1>
          <p className="text-gray-600 mt-1">Manage and monitor transportation routes</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by route code or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="lg:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-full"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredRoutes.length} of {routes.length} routes
        </div>
      </div>

      {/* Routes Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredRoutes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <RouteIcon size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No routes found matching your criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Distance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stops
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRoutes.map((route) => (
                  <tr 
                    key={route.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/routes/${route.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold"
                          style={{ backgroundColor: route.color || '#6366f1' }}
                        >
                          {route.route_code}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {route.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            Code: {route.route_code}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(route.status)}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(route.status)}`}>
                          {route.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-900">
                        <MapPin size={16} className="text-gray-400" />
                        {route.distance_km ? `${route.distance_km.toFixed(1)} km` : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-900">
                        <Clock size={16} className="text-gray-400" />
                        {route.total_stops || 0} stops
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/routes/${route.id}`)
                        }}
                        className="text-primary-600 hover:text-primary-900 inline-flex items-center gap-1"
                      >
                        <Eye size={16} />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
