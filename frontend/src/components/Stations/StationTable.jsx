import { Edit2, Trash2, Eye, MapPin, Users, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import EditModal from '@/components/shared/EditModal'

export default function StationTable({ 
  stations, 
  loading, 
  canEdit, 
  selectedStation, 
  setSelectedStation, 
  onEdit, 
  onDelete 
}) {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'inactive':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'maintenance':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
      maintenance: 'bg-yellow-100 text-yellow-800'
    }
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.toUpperCase() || 'UNKNOWN'}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Station
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Routes
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Capacity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stations.map((station) => (
              <tr key={station.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {station.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {station.code}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {station.address}
                  </div>
                  <div className="text-sm text-gray-500">
                    {station.city}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1">
                    {station.routes?.slice(0, 3).map((route) => (
                      <span
                        key={route.id}
                        className="px-2 py-1 text-xs font-medium rounded-full"
                        style={{
                          backgroundColor: route.color + '20',
                          color: route.color
                        }}
                      >
                        {route.code}
                      </span>
                    ))}
                    {station.routes?.length > 3 && (
                      <span className="px-2 py-1 text-xs text-gray-500">
                        +{station.routes.length - 3}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(station.status)}
                    {getStatusBadge(station.status)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {station.capacity || '-'}
                  </div>
                  {station.currentLoad !== undefined && (
                    <div className="text-xs text-gray-500">
                      {station.currentLoad} currently
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedStation(station)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    {canEdit && (
                      <>
                        <button
                          onClick={() => onEdit(station)}
                          className="text-green-600 hover:text-green-900 transition-colors"
                          title="Edit Station"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => onDelete(station)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Delete Station"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {stations.length === 0 && !loading && (
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No stations found</h3>
          <p className="text-gray-500">Try adjusting your filters or search terms.</p>
        </div>
      )}

      {selectedStation && (
        <EditModal
          isOpen={!!selectedStation}
          onClose={() => setSelectedStation(null)}
          title="Station Details"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Station ID</label>
              <p className="text-sm text-gray-900">{selectedStation.id}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <p className="text-sm text-gray-900">{selectedStation.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Code</label>
              <p className="text-sm text-gray-900">{selectedStation.code}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <p className="text-sm text-gray-900">{selectedStation.address}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">City</label>
              <p className="text-sm text-gray-900">{selectedStation.city}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Coordinates</label>
              <p className="text-sm text-gray-900">
                {selectedStation.latitude}, {selectedStation.longitude}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <div className="flex items-center gap-2">
                {getStatusIcon(selectedStation.status)}
                {getStatusBadge(selectedStation.status)}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Routes</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {selectedStation.routes?.map((route) => (
                  <span
                    key={route.id}
                    className="px-2 py-1 text-xs font-medium rounded-full"
                    style={{
                      backgroundColor: route.color + '20',
                      color: route.color
                    }}
                  >
                    {route.code} - {route.name}
                  </span>
                ))}
              </div>
            </div>
            {selectedStation.capacity && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Capacity</label>
                <p className="text-sm text-gray-900">{selectedStation.capacity} people</p>
              </div>
            )}
          </div>
        </EditModal>
      )}
    </div>
  )
}
