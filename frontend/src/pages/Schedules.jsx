import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { usePermissions } from '@/hooks/usePermissions'
import { useAllSchedules, useDeactivateSchedule } from '@/hooks/useSchedules'
import { Plus, Search, Filter, Edit, Trash2, Clock, Calendar, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import EditModal from '@/components/shared/EditModal'
import api from '@/services/api'

export default function Schedules() {
  const { isOperator } = usePermissions()
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState(null)

  const [routeFilter, setRouteFilter] = useState('')
  const { data, isLoading: loading, isError, refetch } = useAllSchedules({
    route_id: routeFilter || undefined,
  })
  const schedules = data?.schedules || []

  const queryClient = useQueryClient()
  const { mutate: deactivate, isPending: deactivating } = useDeactivateSchedule()

  const { mutate: updateSchedule, isPending: updating } = useMutation({
    mutationFn: async (scheduleData) => {
      const { id, ...updateData } = scheduleData
      return api.put(`/schedules/${id}`, updateData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['schedules'])
      toast.success('Schedule updated successfully')
      setEditingSchedule(null)
    },
    onError: () => {
      toast.error('Failed to update schedule')
    }
  })

  const handleEdit = (schedule) => {
    setEditingSchedule({
      id: schedule.id,
      routeId: schedule.routeId || '',
      departureTime: schedule.scheduledStart || '',
      arrivalTime: schedule.scheduledEnd || '',
      isActive: schedule.isActive || true,
      daysOfWeek: schedule.dayOfWeek || []
    })
  }

  const handleSaveSchedule = (e) => {
    e.preventDefault()
    updateSchedule(editingSchedule)
  }

  const handleDelete = (schedule) => {
    const routeName = schedule.route?.name || 'this schedule'
    if (!window.confirm(`Deactivate schedule for ${routeName}?`)) return
    deactivate(schedule.id, {
      onSuccess: () => toast.success('Schedule deactivated'),
      onError: () => toast.error('Failed to deactivate schedule'),
    })
  }

  const filteredSchedules = schedules

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Schedules</h1>
            <p className="text-gray-600 mt-1">Manage bus schedules and assignments</p>
          </div>
          
          {isOperator && (
            <button className="btn btn-primary flex items-center gap-2">
              <Plus size={16} />
              Add Schedule
            </button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search schedules..."
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
                <select 
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={routeFilter}
                  onChange={(e) => setRouteFilter(e.target.value)}
                >
                  <option value="">All Routes</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Day Type</label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                  <option value="">All Days</option>
                  <option value="weekday">Weekday</option>
                  <option value="weekend">Weekend</option>
                  <option value="holiday">Holiday</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                  <option value="">All Shifts</option>
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                  <option value="night">Night</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="temporary">Temporary</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Schedules Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isError && (
            <div className="p-8 text-center space-y-3">
              <p className="text-danger-600">Error loading schedules. Check your connection.</p>
              <button onClick={() => refetch()} className="btn btn-secondary">
                Retry
              </button>
            </div>
          )}
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading schedules...</p>
            </div>
          ) : filteredSchedules.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 text-6xl mb-4">📅</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No schedules found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'Try adjusting your search terms' : 'Get started by creating your first schedule'}
              </p>
              {isOperator && !searchTerm && (
                <button className="btn btn-primary flex items-center gap-2 mx-auto">
                  <Plus size={16} />
                  Create Your First Schedule
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Schedule Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timing
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assignments
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pattern
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    {isOperator && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSchedules.map((schedule) => (
                    <tr key={schedule.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{schedule.route?.name}</div>
                        <div className="text-sm text-gray-500">{schedule.route?.code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center gap-1">
                            <Clock size={12} />
                            {schedule.scheduledStart} - {schedule.scheduledEnd}
                          </div>
                          <div className="text-xs text-gray-500">{schedule.frequencyMin} min frequency</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center gap-1">
                            <Users size={12} />
                            {schedule.bus?.plateNumber || 'Unassigned'}
                          </div>
                          <div className="text-xs text-gray-500">{schedule.dayOfWeek?.map(d => ['','Mon','Tue','Wed','Thu','Fri','Sat','Sun'][d]).join(', ')}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center gap-1">
                            <Calendar size={12} />
                            {schedule.dayOfWeek?.map(d => ['','Mon','Tue','Wed','Thu','Fri','Sat','Sun'][d]).join(', ')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          schedule.isActive ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {schedule.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      {isOperator && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleEdit(schedule)}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(schedule)}
                              disabled={deactivating}
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
        </div>

      {/* Edit Schedule Modal */}
      <EditModal
        isOpen={!!editingSchedule}
        onClose={() => setEditingSchedule(null)}
        title="Edit Schedule"
        isLoading={updating}
      >
        <form id="edit-form" onSubmit={handleSaveSchedule} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Route
            </label>
            <select
              value={editingSchedule?.routeId || ''}
              onChange={(e) => setEditingSchedule(prev => ({ ...prev, routeId: e.target.value }))}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-gray-100"
              required
            >
              <option value="">Select Route</option>
              {/* This would be populated with actual routes */}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Departure Time
              </label>
              <input
                type="time"
                value={editingSchedule?.departureTime || ''}
                onChange={(e) => setEditingSchedule(prev => ({ ...prev, departureTime: e.target.value }))}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-gray-100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Arrival Time
              </label>
              <input
                type="time"
                value={editingSchedule?.arrivalTime || ''}
                onChange={(e) => setEditingSchedule(prev => ({ ...prev, arrivalTime: e.target.value }))}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-gray-100"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Days of Week
            </label>
            <div className="space-y-2">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => (
                <label key={day} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingSchedule?.daysOfWeek?.includes(index) || false}
                    onChange={(e) => {
                      const daysOfWeek = [...(editingSchedule?.daysOfWeek || [])]
                      if (e.target.checked) {
                        daysOfWeek.push(index)
                      } else {
                        const idx = daysOfWeek.indexOf(index)
                        if (idx > -1) daysOfWeek.splice(idx, 1)
                      }
                      setEditingSchedule(prev => ({ ...prev, daysOfWeek }))
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{day}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={editingSchedule?.isActive ? 'true' : 'false'}
              onChange={(e) => setEditingSchedule(prev => ({ ...prev, isActive: e.target.value === 'true' }))}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-gray-100"
              required
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </form>
      </EditModal>
    </div>
  )
}
