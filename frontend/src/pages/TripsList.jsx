import { useState } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import { useAllTrips, useDeleteTrip } from '@/hooks/useTrips'
import { Plus, List, Calendar as CalendarIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import TripFilters from '@/components/Trips/TripFilters'
import TripTable from '@/components/Trips/TripTable'
import TripCalendar from '@/components/Trips/TripCalendar'
import TripPagination from '@/components/Trips/TripPagination'

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

  // Query adicional solo activa en modo calendario
  const { data: calendarData } = useAllTrips(1, 500, {
    from: dateFrom || undefined,
    to: dateTo || undefined,
  }, { enabled: viewMode === 'calendar' })

  const calendarTrips = calendarData?.trips || []
  const deleteTrip = useDeleteTrip()

  const handleClearFilters = () => {
    setSearchTerm('')
    setStatusFilter('')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  const handleEdit = (trip) => {
    // TODO: Implement edit functionality
    toast.success('Edit functionality coming soon!')
  }

  const handleDelete = async (trip) => {
    if (window.confirm(`Are you sure you want to delete trip ${trip.id}?`)) {
      try {
        await deleteTrip.mutateAsync(trip.id)
        toast.success('Trip deleted successfully')
        refetch()
      } catch (error) {
        toast.error('Failed to delete trip')
      }
    }
  }

  const handleTripClick = (trip) => {
    setSelectedTrip(trip)
  }

  const filteredTrips = trips.filter(trip =>
    trip.routeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.routeCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.busNumber?.toString().includes(searchTerm)
  )

  if (isError) {
    return (
      <div className="card p-6">
        <div className="text-center">
          <h3 className="text-lg font-medium text-red-600 mb-2">Error Loading Trips</h3>
          <p className="text-gray-600">Please try refreshing the page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trips</h1>
          <p className="text-gray-600">Manage and monitor all bus trips</p>
        </div>
        
        {canEdit && (
          <button className="btn btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Trip
          </button>
        )}
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg w-fit">
        <button
          onClick={() => setViewMode('list')}
          className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
            viewMode === 'list' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <List className="w-4 h-4" />
          List View
        </button>
        <button
          onClick={() => setViewMode('calendar')}
          className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
            viewMode === 'calendar' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          Calendar View
        </button>
      </div>

      {/* Filters */}
      <TripFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        onClearFilters={handleClearFilters}
      />

      {/* Content */}
      {viewMode === 'list' ? (
        <>
          <TripTable
            trips={filteredTrips}
            loading={loading}
            canEdit={canEdit}
            selectedTrip={selectedTrip}
            setSelectedTrip={setSelectedTrip}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
          
          <TripPagination
            pagination={pagination}
            onPageChange={setPage}
            loading={loading}
          />
        </>
      ) : (
        <TripCalendar
          currentMonth={currentMonth}
          setCurrentMonth={setCurrentMonth}
          calendarTrips={calendarTrips}
          onTripClick={handleTripClick}
        />
      )}
    </div>
  )
}
