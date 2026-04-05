import { BarChart3, Clock, MapPin, AlertTriangle } from 'lucide-react'

export default function ReportSelector({ selectedReport, setSelectedReport }) {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {reportTypes.map((report) => {
        const Icon = report.icon
        return (
          <button
            key={report.id}
            onClick={() => setSelectedReport(report.id)}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedReport === report.id
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            } ${!report.available ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!report.available}
          >
            <Icon className="w-6 h-6 mb-2 mx-auto" />
            <h3 className="font-semibold text-sm mb-1">{report.name}</h3>
            <p className="text-xs text-gray-600">{report.description}</p>
          </button>
        )
      })}
    </div>
  )
}
