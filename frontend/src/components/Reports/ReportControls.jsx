import { FileText, Download, Calendar, Filter } from 'lucide-react'

export default function ReportControls({ 
  dateRange, 
  setDateRange, 
  format, 
  setFormat, 
  onGenerate, 
  isGenerating 
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-gray-500" />
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="7days">Last 7 days</option>
          <option value="30days">Last 30 days</option>
          <option value="90days">Last 90 days</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-gray-500" />
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="pdf">PDF</option>
          <option value="csv">CSV</option>
          <option value="excel">Excel</option>
        </select>
      </div>

      <button
        onClick={onGenerate}
        disabled={isGenerating}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Download className="w-4 h-4" />
        {isGenerating ? 'Generating...' : 'Generate Report'}
      </button>
    </div>
  )
}
