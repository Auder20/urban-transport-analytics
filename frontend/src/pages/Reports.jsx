import { useState } from 'react'
import { useDelays, useProblematicRoutes, usePeakHours, useAnomalies } from '@/hooks/useAnalytics'
import toast from 'react-hot-toast'
import ReportSelector from '@/components/Reports/ReportSelector'
import ReportControls from '@/components/Reports/ReportControls'
import ReportPreview from '@/components/Reports/ReportPreview'
import { 
  generatePerformanceCSV, 
  generateDelaysCSV, 
  generateRoutesCSV, 
  generateAnomaliesCSV,
  downloadFile 
} from '@/components/Reports/CSVGenerators'

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
        csvContent = generatePerformanceCSV(delays, problematicRoutes, peakHours, anomalies)
        filename = `performance-report-${dateRange}.csv`
        break
      case 'delays':
        csvContent = generateDelaysCSV(delays)
        filename = `delay-analysis-${dateRange}.csv`
        break
      case 'routes':
        csvContent = generateRoutesCSV(problematicRoutes)
        filename = `route-performance-${dateRange}.csv`
        break
      case 'anomalies':
        csvContent = generateAnomaliesCSV(anomalies)
        filename = `anomaly-report-${dateRange}.csv`
        break
      default:
        throw new Error('Invalid report type')
    }
    
    downloadFile(csvContent, filename, 'text/csv')
  }

  const generatePDFReport = () => {
    // For now, generate HTML and trigger print dialog
    // In a real implementation, you would use a PDF library like jsPDF
    toast.info('PDF generation will open in a new window for printing')
    
    const htmlContent = `
      <html>
        <head>
          <title>Report - ${selectedReport}</title>
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
            <h1>${selectedReport.charAt(0).toUpperCase() + selectedReport.slice(1)} Report</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
            <p>Date Range: Last ${days} days</p>
          </div>
          <h2>Summary</h2>
          <p>This report contains analytics data for selected period.</p>
        </body>
      </html>
    `
    
    const newWindow = window.open('', '_blank')
    newWindow.document.write(htmlContent)
    newWindow.document.close()
    newWindow.print()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600">Generate and download various system reports</p>
      </div>

      {/* Report Type Selector */}
      <ReportSelector 
        selectedReport={selectedReport} 
        setSelectedReport={setSelectedReport} 
      />

      {/* Controls */}
      <ReportControls
        dateRange={dateRange}
        setDateRange={setDateRange}
        format={format}
        setFormat={setFormat}
        onGenerate={generateReport}
        isGenerating={isGenerating}
      />

      {/* Preview */}
      <ReportPreview
        selectedReport={selectedReport}
        delays={delays}
        problematicRoutes={problematicRoutes}
        peakHours={peakHours}
        anomalies={anomalies}
      />
    </div>
  )
}
