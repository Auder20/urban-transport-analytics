import { useState, useCallback, useEffect } from 'react'
import { PageLayout } from '@/components/Layout/PageLayout'
import { usePermissions } from '@/hooks/usePermissions'
import { useAllBuses, useDeleteBus } from '@/hooks/useBuses'
import { Plus, Search, Filter, Edit, Trash2, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

export default function BusesList() {
  const { canEdit } = usePermissions()
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const { data, isLoading: loading, isError } = useAllBuses(page, 20, {
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
  })
  const buses = data?.buses || []
  const pagination = data?.pagination

  const { mutate: deleteBus, isPending: deleting } = useDeleteBus()

  const handleDelete = (bus) => {
    if (!window.confirm(`Deactivate bus ${bus.plateNumber}? It will be marked as inactive.`)) return
    deleteBus(bus.id, {
      onSuccess: () => toast.success(`Bus ${bus.plateNumber} deactivated`),
      onError: () => toast.error('Failed to deactivate bus'),
    })
  }

  const filteredBuses = buses

  return (
    <PageLayout title="Buses Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Buses</h1>
            <p className="text-gray-600 mt-1">Manage your bus fleet</p>
          </div>
          
          {canEdit && (
            <button className="btn btn-primary flex items-center gap-2">
              <Plus size={16} />
              Add Bus
            </button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search buses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Filter size={16} />
            Filters
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select 
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                  <option value="">All Routes</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Occupancy</label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                  <option value="">All Occupancy</option>
                  <option value="low">Low (0-30%)</option>
                  <option value="medium">Medium (30-70%)</option>
                  <option value="high">High (70%+)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Buses Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isError && (
            <div className="p-8 text-center">
              <p className="text-red-600">Error loading buses. Please try again.</p>
            </div>
          )}
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading buses...</p>
            </div>
          ) : filteredBuses.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 text-6xl mb-4">🚌</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No buses found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first bus to the system'}
              </p>
              {canEdit && !searchTerm && (
                <button className="btn btn-primary flex items-center gap-2 mx-auto">
                  <Plus size={16} />
                  Add Your First Bus
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bus
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Route
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Occupancy
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Seen
                    </th>
                    {canEdit && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBuses.map((bus) => (
                    <tr key={bus.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">{bus.plateNumber}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{bus.currentRoute?.name || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          bus.status === 'active' ? 'bg-green-100 text-green-800' :
                          bus.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {bus.status || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{bus.lastLocation ? 'GPS active' : 'No GPS'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {bus.lastSeenAt ? new Date(bus.lastSeenAt).toLocaleString() : 'Never'}
                      </td>
                      {canEdit && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button className="text-primary-600 hover:text-primary-900">
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(bus)}
                              disabled={deleting}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {pagination && pagination.pages > 1 && (
            <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.pages} — {pagination.total} buses
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn btn-secondary text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                  className="btn btn-secondary text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  )
}
