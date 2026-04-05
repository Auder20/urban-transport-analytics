import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { usePermissions } from '@/hooks/usePermissions'
import { useAllStations, useCreateStation, useDeleteStation } from '@/hooks/useStations'
import { Plus, List, Map as MapIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import StationFilters from '@/components/Stations/StationFilters'
import StationTable from '@/components/Stations/StationTable'
import StationMap from '@/components/Stations/StationMap'
import api from '@/services/api'

export default function StationsList() {
  const { canEdit } = usePermissions()
  const [viewMode, setViewMode] = useState('table') // 'table' or 'map'
  const [selectedStation, setSelectedStation] = useState(null)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [routeFilter, setRouteFilter] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [page, setPage] = useState(1)
  const pageSize = 20

  const { mutate: createStation, isPending: creating } = useCreateStation()
  const { mutate: deleteStation } = useDeleteStation()

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fetch stations
  const { data, isLoading, isError, refetch } = useAllStations(page, pageSize, {
    search: debouncedSearch,
    status: statusFilter,
    routeId: routeFilter
  })

  // Fetch routes for filter dropdown
  const { data: routesData } = useQuery({
    queryKey: ['routes'],
    queryFn: async () => {
      const response = await api.get('/routes')
      return response.data
    }
  })

  const stations = data?.stations || []
  const pagination = data?.pagination
  const routes = routesData?.routes || []

  const handleClearFilters = () => {
    setSearchTerm('')
    setStatusFilter('')
    setRouteFilter('')
    setPage(1)
  }

  const handleEdit = (station) => {
    // TODO: Implement edit functionality
    toast.success('Edit functionality coming soon!')
  }

  const handleDelete = async (station) => {
    if (window.confirm(`Are you sure you want to delete station "${station.name}"?`)) {
      try {
        await deleteStation.mutateAsync(station.id)
        toast.success('Station deleted successfully')
        refetch()
      } catch (error) {
        toast.error('Failed to delete station')
      }
    }
  }

  const handleStationSelect = (station) => {
    setSelectedStation(station)
  }

  const filteredStations = stations.filter(station =>
    station.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    station.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    station.address?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isError) {
    return (
      <div className="card p-6">
        <div className="text-center">
          <h3 className="text-lg font-medium text-red-600 mb-2">Error Loading Stations</h3>
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
          <h1 className="text-2xl font-bold text-gray-900">Stations</h1>
          <p className="text-gray-600">Manage and monitor all bus stations</p>
        </div>
        
        {canEdit && (
          <button className="btn btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Station
          </button>
        )}
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg w-fit">
        <button
          onClick={() => setViewMode('table')}
          className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
            viewMode === 'table' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <List className="w-4 h-4" />
          Table View
        </button>
        <button
          onClick={() => setViewMode('map')}
          className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
            viewMode === 'map' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <MapIcon className="w-4 h-4" />
          Map View
        </button>
      </div>

      {/* Filters */}
      <StationFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        routeFilter={routeFilter}
        setRouteFilter={setRouteFilter}
        onClearFilters={handleClearFilters}
        routes={routes}
      />

      {/* Content */}
      {viewMode === 'table' ? (
        <StationTable
          stations={filteredStations}
          loading={isLoading}
          canEdit={canEdit}
          selectedStation={selectedStation}
          setSelectedStation={setSelectedStation}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ) : (
        <StationMap
          stations={filteredStations}
          selectedStation={selectedStation}
          onStationSelect={handleStationSelect}
        />
      )}

      {/* Pagination for table view */}
      {viewMode === 'table' && pagination && (
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              <span className="font-medium">
                {pagination.totalItems || 0}
              </span>
              {' '}stations total
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={!pagination.hasPrev || isLoading}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>

              <span className="px-3 py-1 text-sm text-gray-600">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>

              <button
                onClick={() => setPage(page + 1)}
                disabled={!pagination.hasNext || isLoading}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
