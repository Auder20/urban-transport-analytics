import { useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { usePermissions } from '@/hooks/usePermissions'
import { useAllStations, useCreateStation } from '@/hooks/useStations'
import { Plus, Search, Filter, Edit, Trash2, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import EditModal from '@/components/shared/EditModal'
import api from '@/services/api'

export default function StationsList() {
  const { canEdit } = usePermissions()
  const [showAddModal, setShowAddModal] = useState(false)
  const [newStation, setNewStation] = useState({
    name: '', stationCode: '', lat: '', lng: '', address: '', type: 'stop'
  })
  const { mutate: createStation, isPending: creating } = useCreateStation()
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [editingStation, setEditingStation] = useState(null)

  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState('')
  const { data, isLoading: loading, isError, refetch } = useAllStations(page, 20, {
    type: typeFilter || undefined,
  })
  const stations = data?.stations || []
  const pagination = data?.pagination

  const queryClient = useQueryClient()

  const { mutate: updateStation, isPending: updating } = useMutation({
    mutationFn: async (stationData) => {
      const { id, ...updateData } = stationData
      return api.put(`/stations/${id}`, updateData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations'] })
      toast.success('Station updated successfully')
      setEditingStation(null)
    },
    onError: () => {
      toast.error('Failed to update station')
    }
  })

  const { mutate: deleteStation, isPending: deleting } = useMutation({
    mutationFn: async (stationId) => {
      return api.delete(`/stations/${stationId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations'] })
      toast.success('Station deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete station')
    }
  })

  const handleEdit = (station) => {
    setEditingStation({
      id: station.id,
      name: station.name || '',
      code: station.stationCode || '',
      lat: station.location?.lat || '',
      lng: station.location?.lng || '',
      address: station.address || '',
      isActive: station.isActive || true
    })
  }

  const handleSaveStation = (e) => {
    e.preventDefault()
    updateStation(editingStation)
  }

  const handleDelete = (station) => {
    if (!window.confirm(`Are you sure you want to delete station "${station.name}"? This action cannot be undone.`)) {
      return
    }
    deleteStation(station.id)
  }

  const filteredStations = stations

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stations</h1>
            <p className="text-gray-600 mt-1">Manage bus stops and terminals</p>
          </div>
          
          {canEdit && (
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus size={16} />
              Add Station
            </button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search stations..."
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select 
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={typeFilter}
                  onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
                >
                  <option value="">All Types</option>
                  <option value="bus_stop">Bus Stop</option>
                  <option value="terminal">Terminal</option>
                  <option value="depot">Depot</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Accessibility</label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                  <option value="">All</option>
                  <option value="accessible">Accessible</option>
                  <option value="not_accessible">Not Accessible</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Stations Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isError && (
            <div className="p-8 text-center space-y-3">
              <p className="text-danger-600">Error loading stations. Check your connection.</p>
              <button onClick={() => refetch()} className="btn btn-secondary">
                Retry
              </button>
            </div>
          )}
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading stations...</p>
            </div>
          ) : filteredStations.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 text-6xl mb-4">🚏</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No stations found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first station to the system'}
              </p>
              {canEdit && !searchTerm && (
                <button className="btn btn-primary flex items-center gap-2 mx-auto">
                  <Plus size={16} />
                  Add Your First Station
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Station
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    {canEdit && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStations.map((station) => (
                    <tr key={station.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <MapPin className="text-gray-400 mr-2" size={16} />
                          <div className="text-sm font-medium text-gray-900">{station.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{station.stationCode || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          station.type === 'terminal' ? 'bg-blue-100 text-blue-800' :
                          station.type === 'depot' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {station.type || 'Bus Stop'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {station.location?.lat?.toFixed(4)}, {station.location?.lng?.toFixed(4)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          station.isActive ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {station.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleEdit(station)}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(station)}
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
                Page {pagination.page} of {pagination.pages} — {pagination.total} stations
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

      {/* Edit Station Modal */}
      <EditModal
        isOpen={!!editingStation}
        onClose={() => setEditingStation(null)}
        title="Edit Station"
        isLoading={updating}
      >
        <form id="edit-form" onSubmit={handleSaveStation} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Station Name
            </label>
            <input
              type="text"
              value={editingStation?.name || ''}
              onChange={(e) => setEditingStation(prev => ({ ...prev, name: e.target.value }))}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-gray-100"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Station Code
            </label>
            <input
              type="text"
              value={editingStation?.code || ''}
              onChange={(e) => setEditingStation(prev => ({ ...prev, code: e.target.value }))}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-gray-100"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                value={editingStation?.lat || ''}
                onChange={(e) => setEditingStation(prev => ({ ...prev, lat: parseFloat(e.target.value) || 0 }))}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-gray-100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                value={editingStation?.lng || ''}
                onChange={(e) => setEditingStation(prev => ({ ...prev, lng: parseFloat(e.target.value) || 0 }))}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-gray-100"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Address
            </label>
            <input
              type="text"
              value={editingStation?.address || ''}
              onChange={(e) => setEditingStation(prev => ({ ...prev, address: e.target.value }))}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-gray-100"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={editingStation?.isActive ? 'true' : 'false'}
              onChange={(e) => setEditingStation(prev => ({ ...prev, isActive: e.target.value === 'true' }))}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-gray-100"
              required
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </form>
      </EditModal>

      {/* Add Station Modal */}
      <EditModal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setNewStation({ name: '', stationCode: '', lat: '', lng: '', address: '', type: 'stop' }) }}
        title="Add Station"
        isLoading={creating}
      >
        <form id="edit-form" onSubmit={(e) => {
          e.preventDefault()
          createStation(newStation, {
            onSuccess: () => { setShowAddModal(false); toast.success('Station added') },
            onError: () => toast.error('Failed to add station')
          })
        }} className="space-y-4">
          <div>
            <label className="label">Name *</label>
            <input className="input" required value={newStation.name}
              onChange={e => setNewStation(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label className="label">Station Code</label>
            <input className="input" value={newStation.stationCode}
              onChange={e => setNewStation(p => ({ ...p, stationCode: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Latitude</label>
              <input className="input" type="number" step="0.000001" value={newStation.lat}
                onChange={e => setNewStation(p => ({ ...p, lat: parseFloat(e.target.value) || '' }))} />
            </div>
            <div>
              <label className="label">Longitude</label>
              <input className="input" type="number" step="0.000001" value={newStation.lng}
                onChange={e => setNewStation(p => ({ ...p, lng: parseFloat(e.target.value) || '' }))} />
            </div>
          </div>
          <div>
            <label className="label">Address</label>
            <input className="input" value={newStation.address}
              onChange={e => setNewStation(p => ({ ...p, address: e.target.value }))} />
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input" value={newStation.type}
              onChange={e => setNewStation(p => ({ ...p, type: e.target.value }))}>
              <option value="stop">Stop</option>
              <option value="terminal">Terminal</option>
              <option value="hub">Hub</option>
            </select>
          </div>
        </form>
      </EditModal>
    </div>
  )
}
