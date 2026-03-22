import { useState } from 'react'
import {
  startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, format, isSameDay, isToday
} from 'date-fns'
import { usePermissions } from '@/hooks/usePermissions'
import { useAllTrips } from '@/hooks/useTrips'
import { Plus, Search, Filter, Edit, Trash2, Calendar, Clock, Route, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import EditModal from '@/components/shared/EditModal'

export default function TripsList() {
  const { canEdit } = usePermissions()
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState('list') // 'list' or 'calendar'
  const [selectedTrip, setSelectedTrip] = useState(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const { data, isLoading: loading, isError, refetch } = useAllTrips(page, 20, {
    status: statusFilter || undefined,
    from: dateFrom || undefined,
    to: dateTo || undefined,
  })
  const trips = data?.trips || []
  const pagination = data?.pagination

  // Calcula el rango del mes actual para el calendario
  const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd')

  // Query adicional solo activa en modo calendario
  const { data: calendarData } = useAllTrips(1, 500, {
    from: monthStart,
    to: monthEnd,
  }, { enabled: viewMode === 'calendar' })

  const calendarTrips = calendarData?.trips || []

  const filteredTrips = trips

  // Helper functions for calendar view
  const getTripsForDay = (day) =>
    calendarTrips.filter(t => isSameDay(new Date(t.startedAt), day))

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  })

  const handleViewTrip = (trip) => {
    setSelectedTrip(trip)
  }

  const getDelayBadgeColor = (delayMinutes) => {
    if (delayMinutes == null) return 'bg-gray-100 text-gray-800'
    if (delayMinutes <= 5) return 'bg-green-100 text-green-800'
    if (delayMinutes <= 15) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Trips</h1>
            <p className="text-gray-600 mt-1">Manage and monitor bus trips</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                List View
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                Calendar View
              </button>
            </div>
            
            {canEdit && (
              <div className="relative group">
                <button disabled className="btn btn-primary flex items-center gap-2 opacity-50 cursor-not-allowed">
                  <Plus size={16} /> Add Trip
                </button>
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100">
                  Trips are created automatically by the tracking system
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search trips..."
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
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select 
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
                >
                  <option value="">All Status</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                  <option value="">All Routes</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Driver</label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                  <option value="">All Drivers</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Trips Content */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isError && (
            <div className="p-8 text-center space-y-3">
              <p className="text-danger-600">Error loading trips. Check your connection.</p>
              <button onClick={() => refetch()} className="btn btn-secondary">
                Retry
              </button>
            </div>
          )}
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading trips...</p>
            </div>
          ) : viewMode === 'calendar' ? (
            <div className="p-8">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  Previous
                </button>
                <h2 className="text-xl font-semibold text-gray-900">
                  {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  Next
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                {/* Weekday headers */}
                <div className="grid grid-cols-7 bg-gray-50">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="p-2 text-center text-xs font-medium text-gray-700 border-b">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7">
                  {/* Empty cells for days before month starts */}
                  {Array(getDay(startOfMonth(currentMonth))).fill(null).map((_, index) => (
                    <div key={`empty-${index}`} className="p-2 border-r border-b"></div>
                  ))}

                  {/* Days of the month */}
                  {daysInMonth.map(day => {
                    const dayTrips = getTripsForDay(day)
                    const hasTrips = dayTrips.length > 0
                    
                    return (
                      <div
                        key={day.toISOString()}
                        onClick={() => hasTrips && setSelectedTrip(dayTrips[0])}
                        className={`
                          p-2 border-r border-b min-h-[80px] cursor-pointer
                          ${isToday(day) ? 'bg-blue-50' : 'hover:bg-gray-50'}
                          ${hasTrips ? 'relative' : ''}
                        `}
                      >
                        <div className={`
                          text-sm font-medium
                          ${isToday(day) ? 'text-blue-600' : 'text-gray-900'}
                        `}>
                          {format(day, 'd')}
                        </div>
                        
                        {/* Trip indicators */}
                        {hasTrips && (
                          <div className="absolute bottom-1 left-1 right-1">
                            <div className="flex gap-1 justify-center">
                              {dayTrips.slice(0, 3).map((trip, index) => (
                                <div
                                  key={trip.id}
                                  className={`
                                    w-2 h-2 rounded-full
                                    ${trip.delayMinutes <= 5 ? 'bg-green-500' : 'bg-red-500'}
                                  `}
                                  title={`${trip.route?.routeCode} - ${trip.delayMinutes}min delay`}
                                />
                              ))}
                              {dayTrips.length > 3 && (
                                <div className="w-2 h-2 bg-gray-400 rounded-full text-xs">
                                  +{dayTrips.length - 3}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : filteredTrips.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 text-6xl mb-4">🚐</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No trips found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'Try adjusting your search terms' : 'Get started by scheduling your first trip'}
              </p>
              {canEdit && !searchTerm && (
                <button className="btn btn-primary flex items-center gap-2 mx-auto">
                  <Plus size={16} />
                  Schedule Your First Trip
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trip Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Route
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Schedule
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Driver
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance
                    </th>
                    {canEdit && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTrips.map((trip) => (
                    <tr key={trip.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{trip.id?.slice(0, 8)}...</div>
                        <div className="text-sm text-gray-500">{trip.bus?.plateNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Route className="text-gray-400 mr-2" size={16} />
                          <div className="text-sm text-gray-900">{trip.route?.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center gap-1">
                            <Clock size={12} />
                            {trip.startedAt ? new Date(trip.startedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">{trip.startedAt ? new Date(trip.startedAt).toLocaleDateString() : ''}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{trip.driver?.name || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          trip.status === 'completed' ? 'bg-green-100 text-green-800' :
                          trip.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          trip.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {trip.status || 'Scheduled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          (trip.delayMinutes || 0) <= 5 ? 'bg-green-100 text-green-800' :
                          (trip.delayMinutes || 0) <= 15 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {trip.delayMinutes != null ? `${trip.delayMinutes} min` : 'N/A'}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewTrip(trip)}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => toast('Trips are historical records and cannot be deleted', { icon: 'ℹ️' })}
                              className="text-red-600 hover:text-red-900"
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
                Page {pagination.page} of {pagination.pages} — {pagination.total} trips
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

      {/* Trip Details Modal */}
      <EditModal
        isOpen={!!selectedTrip}
        onClose={() => setSelectedTrip(null)}
        title="Trip Details"
        readOnly={true}
      >
        {selectedTrip && (
          <div className="space-y-6">
            {/* Trip Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Trip ID
                </label>
                <div className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                  {selectedTrip.id}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  selectedTrip.status === 'completed' ? 'bg-green-100 text-green-800' :
                  selectedTrip.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  selectedTrip.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {selectedTrip.status || 'Scheduled'}
                </span>
              </div>
            </div>

            {/* Route Information */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Route Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Route Code
                  </label>
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {selectedTrip.route?.code || 'N/A'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Route Name
                  </label>
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {selectedTrip.route?.name || 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Bus Information */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Bus Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Plate Number
                  </label>
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {selectedTrip.bus?.plateNumber || 'N/A'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Driver
                  </label>
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {selectedTrip.driver?.name || 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Schedule</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Started At
                  </label>
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {selectedTrip.startedAt 
                      ? new Date(selectedTrip.startedAt).toLocaleString()
                      : 'N/A'
                    }
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Completed At
                  </label>
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {selectedTrip.completedAt 
                      ? new Date(selectedTrip.completedAt).toLocaleString()
                      : 'N/A'
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* Performance */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Performance</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Delay
                  </label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDelayBadgeColor(selectedTrip.delayMinutes)}`}>
                    {selectedTrip.delayMinutes != null ? `${selectedTrip.delayMinutes} min` : 'N/A'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Passenger Count
                  </label>
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {selectedTrip.passengerCount || 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </EditModal>
    </div>
  )
}
