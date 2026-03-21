import { useState } from 'react'
import { FileText, Download, Calendar, Filter, BarChart3, Clock, MapPin, AlertTriangle } from 'lucide-react'
import { useDelays, useProblematicRoutes, usePeakHours, useAnomalies } from '@/hooks/useAnalytics'
import api from '@/services/api'
import toast from 'react-hot-toast'

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState('performance')
  const [dateRange, setDateRange] = useState('7days')
  const [format, setFormat] = useState('pdf')
  const [isGenerating, setIsGenerating] = useState(false)

  // Proper days mapping instead of fragile string manipulation
  const DAY_MAP = { '7days': 7, '30days': 30, '90days': 90 }
  const days = DAY_MAP[dateRange] || 7

  const { data: delays } = useDelays({ days })
  const { data: problematicRoutes } = useProblematicRoutes({ days })
  const { data: peakHours } = usePeakHours({ days })
  const { data: anomalies } = useAnomalies({ days })

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
      
      if (format === 'csv') {
        generateCSVReport()
      } else if (format === 'pdf') {
        generatePDFReport()
      } else if (format === 'excel') {
        generateCSVReport() // For now, use CSV format for Excel option
      }
      
      toast.success(`Report generated successfully as ${format.toUpperCase()}`)
    } catch (err) {
      console.error('Error generating report:', err)
      toast.error('Error generating report')
    } finally {
      setIsGenerating(false)
    }
  }

  const generateCSVReport = () => {
    let csvContent = ''
    let filename = ''
    
    switch (selectedReport) {
      case 'performance':
        csvContent = generatePerformanceCSV()
        filename = `performance-report-${dateRange}.csv`
        break
      case 'delays':
        csvContent = generateDelaysCSV()
        filename = `delay-analysis-${dateRange}.csv`
        break
      case 'routes':
        csvContent = generateRoutesCSV()
        filename = `route-performance-${dateRange}.csv`
        break
      case 'anomalies':
        csvContent = generateAnomaliesCSV()
        filename = `anomaly-report-${dateRange}.csv`
        break
      default:
        throw new Error('Invalid report type')
    }
    
    downloadFile(csvContent, filename, 'text/csv')
  }

  const generatePDFReport = () => {
    let htmlContent = ''
    let filename = ''
    
    switch (selectedReport) {
      case 'performance':
        htmlContent = generatePerformanceHTML()
        filename = `performance-report-${dateRange}.html`
        break
      case 'delays':
        htmlContent = generateDelaysHTML()
        filename = `delay-analysis-${dateRange}.html`
        break
      case 'routes':
        htmlContent = generateRoutesHTML()
        filename = `route-performance-${dateRange}.html`
        break
      case 'anomalies':
        htmlContent = generateAnomaliesHTML()
        filename = `anomaly-report-${dateRange}.html`
        break
      default:
        throw new Error('Invalid report type')
    }
    
    downloadFile(htmlContent, filename, 'text/html')
    // Auto-open print dialog for PDF-like experience
    const newWindow = window.open('', '_blank')
    newWindow.document.write(htmlContent)
    newWindow.document.close()
    newWindow.print()
  }

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const generatePerformanceCSV = () => {
    const routes = problematicRoutes?.routes || []
    let csv = 'Route Name,Route Code,Average Delay,Total Trips,On-Time %,Problematic Trips\n'
    
    routes.forEach(route => {
      csv += `"${route.name}","${route.routeCode}",${route.averageDelay || 0},${route.totalTrips || 0},${route.onTimePercentage || 0}%,${route.problematicTrips || 0}\n`
    })
    
    return csv
  }

  const generateDelaysCSV = () => {
    const delayData = delays?.delays || []
    let csv = 'Route,Route Code,Hour,Trip Count,Average Delay,Max Delay,Problematic Trips\n'
    
    delayData.forEach(delay => {
      csv += `"${delay.route?.name}","${delay.route?.code}","${delay.hour}",${delay.tripCount},${delay.averageDelay || 0},${delay.maxDelay || 0},${delay.problematicTrips || 0}\n`
    })
    
    return csv
  }

  const generateRoutesCSV = () => {
    const routes = problematicRoutes?.routes || []
    let csv = 'Route Name,Route Code,Color,Average Delay,Max Delay,Total Trips,On-Time Trips,On-Time %,Problematic Trips\n'
    
    routes.forEach(route => {
      csv += `"${route.name}","${route.routeCode}","${route.color}",${route.averageDelay || 0},${route.maxDelay || 0},${route.totalTrips || 0},${route.onTimeTrips || 0},${route.onTimePercentage || 0}%,${route.problematicTrips || 0}\n`
    })
    
    return csv
  }

  const generateAnomaliesCSV = () => {
    const anomalyData = anomalies || []
    let csv = 'Trip ID,Route ID,Description,Severity,Detection Time\n'
    
    anomalyData.forEach(anomaly => {
      csv += `"${anomaly.trip_id}","${anomaly.route_id}","${anomaly.description}","${anomaly.severity}","${anomaly.detected_at || new Date().toISOString()}"\n`
    })
    
    return csv
  }

  const generatePerformanceHTML = () => {
    const routes = problematicRoutes?.routes || []
    const avgDelay = routes.reduce((sum, r) => sum + (r.averageDelay || 0), 0) / (routes.length || 1)
    const onTimePercent = routes.reduce((sum, r) => sum + (r.onTimePercentage || 0), 0) / (routes.length || 1)
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Performance Report - ${dateRange}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .metrics { display: flex; justify-content: space-around; margin-bottom: 30px; }
          .metric { text-align: center; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Performance Report</h1>
          <p>Period: ${dateRange}</p>
          <p>Generated: ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="metrics">
          <div class="metric">
            <h3>Total Routes</h3>
            <h2>${routes.length}</h2>
          </div>
          <div class="metric">
            <h3>Average Delay</h3>
            <h2>${avgDelay.toFixed(1)} min</h2>
          </div>
          <div class="metric">
            <h3>On-Time %</h3>
            <h2>${onTimePercent.toFixed(1)}%</h2>
          </div>
        </div>
        
        <h2>Route Performance Details</h2>
        <table>
          <thead>
            <tr>
              <th>Route Name</th>
              <th>Route Code</th>
              <th>Average Delay</th>
              <th>Total Trips</th>
              <th>On-Time %</th>
              <th>Problematic Trips</th>
            </tr>
          </thead>
          <tbody>
            ${routes.map(route => `
              <tr>
                <td>${route.name}</td>
                <td>${route.routeCode}</td>
                <td>${(route.averageDelay || 0).toFixed(1)} min</td>
                <td>${route.totalTrips || 0}</td>
                <td>${(route.onTimePercentage || 0).toFixed(1)}%</td>
                <td>${route.problematicTrips || 0}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `
  }

  const generateDelaysHTML = () => {
    const delayData = delays?.delays || []
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Delay Analysis Report - ${dateRange}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .summary { display: flex; justify-content: space-around; margin-bottom: 30px; }
          .summary-item { text-align: center; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Delay Analysis Report</h1>
          <p>Period: ${dateRange}</p>
          <p>Generated: ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="summary">
          <div class="summary-item">
            <h3>Total Records</h3>
            <h2>${delayData.length}</h2>
          </div>
          <div class="summary-item">
            <h3>On-time (≤5 min)</h3>
            <h2>${delayData.filter(d => d.averageDelay <= 5).length}</h2>
          </div>
          <div class="summary-item">
            <h3>Severe (>15 min)</h3>
            <h2>${delayData.filter(d => d.averageDelay > 15).length}</h2>
          </div>
        </div>
        
        <h2>Delay Details</h2>
        <table>
          <thead>
            <tr>
              <th>Route</th>
              <th>Route Code</th>
              <th>Hour</th>
              <th>Trip Count</th>
              <th>Average Delay</th>
              <th>Max Delay</th>
              <th>Problematic Trips</th>
            </tr>
          </thead>
          <tbody>
            ${delayData.map(delay => `
              <tr>
                <td>${delay.route?.name}</td>
                <td>${delay.route?.code}</td>
                <td>${delay.hour}</td>
                <td>${delay.tripCount}</td>
                <td>${(delay.averageDelay || 0).toFixed(1)} min</td>
                <td>${(delay.maxDelay || 0).toFixed(1)} min</td>
                <td>${delay.problematicTrips || 0}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `
  }

  const generateRoutesHTML = () => {
    const routes = problematicRoutes?.routes || []
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Route Performance Report - ${dateRange}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Route Performance Report</h1>
          <p>Period: ${dateRange}</p>
          <p>Generated: ${new Date().toLocaleString()}</p>
        </div>
        
        <h2>Route Performance Details</h2>
        <table>
          <thead>
            <tr>
              <th>Route Name</th>
              <th>Route Code</th>
              <th>Color</th>
              <th>Average Delay</th>
              <th>Max Delay</th>
              <th>Total Trips</th>
              <th>On-Time Trips</th>
              <th>On-Time %</th>
              <th>Problematic Trips</th>
            </tr>
          </thead>
          <tbody>
            ${routes.map(route => `
              <tr>
                <td>${route.name}</td>
                <td>${route.routeCode}</td>
                <td><span style="display: inline-block; width: 20px; height: 20px; background-color: ${route.color};"></span></td>
                <td>${(route.averageDelay || 0).toFixed(1)} min</td>
                <td>${(route.maxDelay || 0).toFixed(1)} min</td>
                <td>${route.totalTrips || 0}</td>
                <td>${route.onTimeTrips || 0}</td>
                <td>${(route.onTimePercentage || 0).toFixed(1)}%</td>
                <td>${route.problematicTrips || 0}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `
  }

  const generateAnomaliesHTML = () => {
    const anomalyData = anomalies || []
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Anomaly Report - ${dateRange}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .summary { text-align: center; margin-bottom: 30px; }
          .severity-critical { color: #dc3545; font-weight: bold; }
          .severity-high { color: #fd7e14; font-weight: bold; }
          .severity-medium { color: #ffc107; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Anomaly Report</h1>
          <p>Period: ${dateRange}</p>
          <p>Generated: ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="summary">
          <h2>Total Anomalies: ${anomalyData.length}</h2>
        </div>
        
        <h2>Anomaly Details</h2>
        <table>
          <thead>
            <tr>
              <th>Trip ID</th>
              <th>Route ID</th>
              <th>Description</th>
              <th>Severity</th>
              <th>Detection Time</th>
            </tr>
          </thead>
          <tbody>
            ${anomalyData.map(anomaly => `
              <tr>
                <td>${anomaly.trip_id}</td>
                <td>${anomaly.route_id}</td>
                <td>${anomaly.description}</td>
                <td class="severity-${anomaly.severity}">${anomaly.severity.toUpperCase()}</td>
                <td>${anomaly.detected_at || new Date().toISOString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `
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

