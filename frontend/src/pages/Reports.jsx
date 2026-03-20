import { useState } from 'react'
import { FileText, Download, Calendar, Filter, BarChart3, Clock, MapPin, AlertTriangle } from 'lucide-react'
import { useDelays, useProblematicRoutes, usePeakHours, useAnomalies } from '@/hooks/useAnalytics'
import api from '@/services/api'

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState('performance')
  const [dateRange, setDateRange] = useState('7days')
  const [format, setFormat] = useState('pdf')
  const [isGenerating, setIsGenerating] = useState(false)

  const { data: delays } = useDelays({ days: parseInt(dateRange.replace('days', '')) })
  const { data: problematicRoutes } = useProblematicRoutes({ days: parseInt(dateRange.replace('days', '')) })
  const { data: peakHours } = usePeakHours({ days: parseInt(dateRange.replace('days', '')) })
  const { data: anomalies } = useAnomalies({ days: parseInt(dateRange.replace('days', '')) })

  const reportTypes = [
    {
      id: 'performance',
      name: 'Performance Report',
      description: 'Overall system performance metrics and KPIs',
      icon: BarChart3,
      available: true
    },
    {
      id: 'delays',
      name: 'Delay Analysis',
      description: 'Detailed delay analysis by route and time',
      icon: Clock,
      available: true
    },
    {
      id: 'routes',
      name: 'Route Performance',
      description: 'Individual route performance comparison',
      icon: MapPin,
      available: true
    },
    {
      id: 'anomalies',
      name: 'Anomaly Report',
      description: 'Detected anomalies and unusual patterns',
      icon: AlertTriangle,
      available: true
    }
  ]

  const generateReport = async () => {
    try {
      setIsGenerating(true)
      const response = await api.get('/analytics/export', {
        params: { type: selectedReport, days: dateRange.replace('days', ''), format },
        responseType: 'blob'
      })
      const url = URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = `${selectedReport}-report-${dateRange}.${format === 'pdf' ? 'pdf' : 'csv'}` 
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('Error al generar el reporte. Intenta de nuevo.')
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadReport = (reportId) => {
    // Mock download
    console.log(`Downloading report ${reportId}`)
    // In a real app, this would trigger a file download
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600">Generate and download analytical reports</p>
      </div>

      {/* Report Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportTypes.map((report) => {
          const Icon = report.icon
          return (
            <button
              key={report.id}
              onClick={() => setSelectedReport(report.id)}
              className={`card p-4 text-left transition-all ${
                selectedReport === report.id 
                  ? 'ring-2 ring-primary-500 bg-primary-50' 
                  : 'hover:bg-gray-50'
              }`}
              disabled={!report.available}
            >
              <div className="flex items-center gap-3 mb-2">
                <Icon size={20} className={selectedReport === report.id ? 'text-primary-600' : 'text-gray-400'} />
                <h3 className="font-semibold">{report.name}</h3>
              </div>
              <p className="text-sm text-gray-600">{report.description}</p>
              {!report.available && (
                <p className="text-xs text-gray-400 mt-2">Coming soon</p>
              )}
            </button>
          )
        })}
      </div>

      {/* Report Configuration */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Report Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Date Range */}
          <div>
            <label className="label">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="input"
            >
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="90days">Last 90 days</option>
              <option value="custom">Custom range</option>
            </select>
          </div>

          {/* Format */}
          <div>
            <label className="label">Export Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="input"
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
            </select>
          </div>

          {/* Generate Button */}
          <div className="flex items-end">
            <button
              onClick={generateReport}
              disabled={isGenerating}
              className="btn btn-primary w-full"
            >
              {isGenerating ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Report Preview */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Report Preview</h3>
        
        {selectedReport === 'performance' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Routes</p>
                <p className="text-2xl font-bold">{problematicRoutes?.routes?.length || 0}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Avg Delay</p>
                <p className="text-2xl font-bold text-orange-600">
                  {problematicRoutes?.routes?.reduce((sum, r) => sum + (r.averageDelay || 0), 0) / (problematicRoutes?.routes?.length || 1) || 0}
                  min
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">On-Time %</p>
                <p className="text-2xl font-bold text-green-600">
                  {problematicRoutes?.routes?.reduce((sum, r) => sum + (r.onTimePercentage || 0), 0) / (problematicRoutes?.routes?.length || 1) || 0}%
                </p>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Top Problematic Routes</h4>
              <div className="space-y-2">
                {problematicRoutes?.routes?.slice(0, 5).map((route) => (
                  <div key={route.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span>{route.name}</span>
                    <span className="text-orange-600">{route.averageDelay?.toFixed(1)} min</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedReport === 'delays' && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Delay Records</p>
              <p className="text-2xl font-bold">{delays?.delays?.length || 0}</p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Delay Distribution</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>On-time (≤5 min)</span>
                  <span className="text-green-600 font-medium">
                    {delays?.delays?.filter(d => d.averageDelay <= 5).length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Moderate (5-15 min)</span>
                  <span className="text-orange-600 font-medium">
                    {delays?.delays?.filter(d => d.averageDelay > 5 && d.averageDelay <= 15).length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Severe (&gt;15 min)</span>
                  <span className="text-red-600 font-medium">
                    {delays?.delays?.filter(d => d.averageDelay > 15).length || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedReport === 'anomalies' && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Anomalies</p>
              <p className="text-2xl font-bold text-red-600">{anomalies?.length || 0}</p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Recent Anomalies</h4>
              <div className="space-y-2">
                {anomalies?.slice(0, 5).map((anomaly) => (
                  <div key={anomaly.trip_id} className="flex items-center justify-between p-2 bg-red-50 rounded">
                    <div>
                      <p className="font-medium">{anomaly.route_id}</p>
                      <p className="text-sm text-gray-600">{anomaly.description}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${
                      anomaly.severity === 'critical' ? 'bg-red-100 text-red-800' :
                      anomaly.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {anomaly.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Reports */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Reports</h3>
        
        <div className="space-y-2">
          {[
            { name: 'Performance Report - Last 30 Days', date: '2024-03-14', format: 'PDF' },
            { name: 'Delay Analysis - Last 7 Days', date: '2024-03-13', format: 'Excel' },
            { name: 'Route Performance - February 2024', date: '2024-03-01', format: 'PDF' },
          ].map((report, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText size={16} className="text-gray-400" />
                <div>
                  <p className="font-medium">{report.name}</p>
                  <p className="text-sm text-gray-500">{report.date} • {report.format}</p>
                </div>
              </div>
              <button
                onClick={() => downloadReport(index)}
                className="btn btn-secondary btn-sm"
              >
                <Download size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

