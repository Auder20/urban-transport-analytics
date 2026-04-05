export const generatePerformanceCSV = (delays, problematicRoutes, peakHours, anomalies) => {
  const headers = ['Metric', 'Value', 'Period']
  const rows = [
    ['Total Trips', delays?.total_trips || 0, 'Last 7 days'],
    ['Average Delay (minutes)', delays?.avg_delay || 0, 'Last 7 days'],
    ['Problematic Routes', problematicRoutes?.length || 0, 'Last 7 days'],
    ['Total Anomalies', anomalies?.length || 0, 'Last 7 days'],
    ['Peak Hour', peakHours?.peak_hour || 'N/A', 'Last 7 days']
  ]

  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

export const generateDelaysCSV = (delays) => {
  const headers = ['Route', 'Average Delay', 'Max Delay', 'Total Trips', 'Date Range']
  const rows = delays?.by_route?.map(route => [
    route.route_name || 'Unknown',
    route.avg_delay || 0,
    route.max_delay || 0,
    route.total_trips || 0,
    'Last 7 days'
  ]) || []

  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

export const generateRoutesCSV = (problematicRoutes) => {
  const headers = ['Route', 'Issue Type', 'Severity', 'Affected Trips', 'Date Range']
  const rows = problematicRoutes?.map(route => [
    route.route_name || 'Unknown',
    route.issue_type || 'Unknown',
    route.severity || 'Medium',
    route.affected_trips || 0,
    'Last 7 days'
  ]) || []

  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

export const generateAnomaliesCSV = (anomalies) => {
  const headers = ['Type', 'Description', 'Route', 'Severity', 'Detected At', 'Resolved']
  const rows = anomalies?.map(anomaly => [
    anomaly.type || 'Unknown',
    anomaly.description || 'No description',
    anomaly.route_name || 'Unknown',
    anomaly.severity || 'Medium',
    anomaly.detected_at || 'Unknown',
    anomaly.resolved ? 'Yes' : 'No'
  ]) || []

  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

export const downloadFile = (content, filename, mimeType) => {
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
