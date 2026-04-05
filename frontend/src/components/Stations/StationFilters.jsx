import { useState } from 'react'
import { Search, Filter, MapPin } from 'lucide-react'

export default function StationFilters({ 
  searchTerm, 
  setSearchTerm, 
  showFilters, 
  setShowFilters, 
  statusFilter, 
  setStatusFilter, 
  routeFilter, 
  setRouteFilter,
  onClearFilters,
  routes
}) {
  return (
    <div className="card p-6">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search stations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showFilters 
                ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Route
            </label>
            <select
              value={routeFilter}
              onChange={(e) => setRouteFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Routes</option>
              {routes?.map(route => (
                <option key={route.id} value={route.id}>
                  {route.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={onClearFilters}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
