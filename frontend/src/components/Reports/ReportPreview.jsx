import { BarChart3, Clock, MapPin, AlertTriangle } from 'lucide-react'

export default function ReportPreview({ 
  selectedReport, 
  delays, 
  problematicRoutes, 
  peakHours, 
  anomalies 
}) {
  const renderPerformancePreview = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="font-semibold text-gray-700 mb-2">Total Trips</h3>
        <p className="text-2xl font-bold text-blue-600">{delays?.total_trips || 0}</p>
      </div>
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="font-semibold text-gray-700 mb-2">Average Delay</h3>
        <p className="text-2xl font-bold text-orange-600">{delays?.avg_delay || 0} min</p>
      </div>
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="font-semibold text-gray-700 mb-2">Anomalies Detected</h3>
        <p className="text-2xl font-bold text-red-600">{anomalies?.length || 0}</p>
      </div>
    </div>
  )

  const renderDelaysPreview = () => (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-700">Delays by Route</h3>
      </div>
      <div className="p-4">
        {delays?.by_route?.length > 0 ? (
          <div className="space-y-2">
            {delays.by_route.slice(0, 5).map((route, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="font-medium">{route.route_name}</span>
                <span className="text-orange-600 font-semibold">{route.avg_delay} min avg</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No delay data available</p>
        )}
      </div>
    </div>
  )

  const renderRoutesPreview = () => (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-700">Problematic Routes</h3>
      </div>
      <div className="p-4">
        {problematicRoutes?.length > 0 ? (
          <div className="space-y-2">
            {problematicRoutes.slice(0, 5).map((route, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="font-medium">{route.route_name}</span>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  route.severity === 'High' ? 'bg-red-100 text-red-700' :
                  route.severity === 'Medium' ? 'bg-orange-100 text-orange-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {route.severity}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No problematic routes identified</p>
        )}
      </div>
    </div>
  )

  const renderAnomaliesPreview = () => (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-700">Recent Anomalies</h3>
      </div>
      <div className="p-4">
        {anomalies?.length > 0 ? (
          <div className="space-y-2">
            {anomalies.slice(0, 5).map((anomaly, index) => (
              <div key={index} className="p-2 bg-gray-50 rounded">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{anomaly.description}</p>
                    <p className="text-xs text-gray-500">{anomaly.detected_at}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    anomaly.severity === 'High' ? 'bg-red-100 text-red-700' :
                    anomaly.severity === 'Medium' ? 'bg-orange-100 text-orange-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {anomaly.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No anomalies detected</p>
        )}
      </div>
    </div>
  )

  const renderPreview = () => {
    switch (selectedReport) {
      case 'performance':
        return renderPerformancePreview()
      case 'delays':
        return renderDelaysPreview()
      case 'routes':
        return renderRoutesPreview()
      case 'anomalies':
        return renderAnomaliesPreview()
      default:
        return <p className="text-gray-500">Select a report type to preview</p>
    }
  }

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Report Preview</h2>
      {renderPreview()}
    </div>
  )
}
