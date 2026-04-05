export default function TripPagination({ pagination, onPageChange, loading }) {
  if (!pagination || pagination.totalPages <= 1) {
    return null
  }

  const { currentPage, totalPages, hasNext, hasPrev } = pagination

  const getVisiblePages = () => {
    const delta = 2
    const range = []
    const rangeWithDots = []

    for (let i = Math.max(2, currentPage - delta); 
         i <= Math.min(totalPages - 1, currentPage + delta); 
         i++) {
      range.push(i)
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages)
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-700">
          <span className="font-medium">
            {pagination.totalItems || 0}
          </span>
          {' '}trips total
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!hasPrev || loading}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          <div className="flex items-center gap-1">
            {getVisiblePages().map((page, index) => (
              <span key={index}>
                {page === '...' ? (
                  <span className="px-3 py-1 text-sm text-gray-500">...</span>
                ) : (
                  <button
                    onClick={() => onPageChange(page)}
                    disabled={loading}
                    className={`px-3 py-1 text-sm border rounded-md transition-colors ${
                      page === currentPage
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'border-gray-300 hover:bg-gray-50'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {page}
                  </button>
                )}
              </span>
            ))}
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!hasNext || loading}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
