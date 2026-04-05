import { Edit2, Trash2, Eye, Clock, Route, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import EditModal from '@/components/shared/EditModal'

export default function TripTable({ 
  trips, 
  loading, 
  canEdit, 
  selectedTrip, 
  setSelectedTrip, 
  onEdit, 
  onDelete 
}) {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-500" />
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'delayed':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      completed: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      delayed: 'bg-yellow-100 text-yellow-800'
    }
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
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
                Trip
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Route
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bus
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Start Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {trips.map((trip) => (
              <tr key={trip.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Route className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900">
                      {trip.routeName}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {trip.routeCode}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    Bus {trip.busNumber}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(trip.status)}
                    {getStatusBadge(trip.status)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {new Date(trip.startedAt).toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {trip.duration ? `${Math.round(trip.duration)} min` : '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedTrip(trip)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    {canEdit && (
                      <>
                        <button
                          onClick={() => onEdit(trip)}
                          className="text-green-600 hover:text-green-900 transition-colors"
                          title="Edit Trip"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => onDelete(trip)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Delete Trip"
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
      
      {trips.length === 0 && !loading && (
        <div className="text-center py-12">
          <Route className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No trips found</h3>
          <p className="text-gray-500">Try adjusting your filters or search terms.</p>
        </div>
      )}

      {selectedTrip && (
        <EditModal
          isOpen={!!selectedTrip}
          onClose={() => setSelectedTrip(null)}
          title="Trip Details"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Trip ID</label>
              <p className="text-sm text-gray-900">{selectedTrip.id}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Route</label>
              <p className="text-sm text-gray-900">{selectedTrip.routeName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Bus</label>
              <p className="text-sm text-gray-900">Bus {selectedTrip.busNumber}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <div className="flex items-center gap-2">
                {getStatusIcon(selectedTrip.status)}
                {getStatusBadge(selectedTrip.status)}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Time</label>
              <p className="text-sm text-gray-900">
                {new Date(selectedTrip.startedAt).toLocaleString()}
              </p>
            </div>
            {selectedTrip.completedAt && (
              <div>
                <label className="block text-sm font-medium text-gray-700">End Time</label>
                <p className="text-sm text-gray-900">
                  {new Date(selectedTrip.completedAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </EditModal>
      )}
    </div>
  )
}
