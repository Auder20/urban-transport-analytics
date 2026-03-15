import { useKPIS, useDelays, useProblematicRoutes, usePeakHours } from '@/hooks/useAnalytics'
import { useBusLocations } from '@/hooks/useBusLocations'
import { KPICard, KPICardSimple } from '@/components/Dashboard/KPICard'
import { DelayChart, RouteDelayChart } from '@/components/Dashboard/DelayChart'
import { RoutePerformance, RoutePerformanceTable } from '@/components/Dashboard/RoutePerformance'
import { PeakHoursChart, PassengerFlowChart, PeakHoursSummary } from '@/components/Dashboard/PeakHoursChart'
import { MiniMap } from '@/components/Map/TransportMap'
import { Bus, Users, Clock, TrendingUp, AlertTriangle } from 'lucide-react'

export default function Dashboard() {
  const { data: kpis, isLoading: kpisLoading } = useKPIS()
  const { data: delays, isLoading: delaysLoading } = useDelays()
  const { data: problematicRoutes, isLoading: routesLoading } = useProblematicRoutes()
  const { data: peakHours, isLoading: peakHoursLoading } = usePeakHours()
  const { data: buses } = useBusLocations(15000) // Less frequent updates

  const activeBuses = buses?.length || 0

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Real-time overview of urban transport operations</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICardSimple
          title="Active Buses"
          value={kpis?.activeBuses || 0}
          icon={Bus}
          color="success"
          isLoading={kpisLoading}
        />
        <KPICardSimple
          title="On-Time Performance"
          value={kpis?.onTimePercentageToday || 0}
          unit="%"
          icon={TrendingUp}
          color={kpis?.onTimePercentageToday >= 80 ? 'success' : kpis?.onTimePercentageToday >= 60 ? 'warning' : 'danger'}
          isLoading={kpisLoading}
        />
        <KPICardSimple
          title="Average Delay"
          value={kpis?.averageDelayToday || 0}
          unit="min"
          icon={Clock}
          color={kpis?.averageDelayToday <= 5 ? 'success' : kpis?.averageDelayToday <= 15 ? 'warning' : 'danger'}
          isLoading={kpisLoading}
        />
        <KPICardSimple
          title="Total Routes"
          value={kpis?.totalRoutes || 0}
          icon={Users}
          color="primary"
          isLoading={kpisLoading}
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Delay Chart */}
          <DelayChart data={delays?.delays} />

          {/* Route Performance */}
          <RoutePerformance data={problematicRoutes?.routes} />

          {/* Peak Hours */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PeakHoursChart data={peakHours?.peakHours} />
            <PassengerFlowChart data={peakHours?.peakHours} />
          </div>
        </div>

        {/* Right column - Map and summary */}
        <div className="space-y-6">
          {/* Live Map */}
          <MiniMap />

          {/* Peak Hours Summary */}
          <PeakHoursSummary data={peakHours?.peakHours} />

          {/* Quick Stats */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Buses on route</span>
                <span className="font-medium">{activeBuses}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Routes with delays</span>
                <span className="font-medium text-orange-600">
                  {problematicRoutes?.routes?.filter(r => r.averageDelay > 10).length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Peak hour trips</span>
                <span className="font-medium">
                  {peakHours?.peakHours?.filter(h => h.hour >= 7 && h.hour <= 9 || h.hour >= 17 && h.hour <= 19)
                    .reduce((sum, h) => sum + (h.tripCount || 0), 0) || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle size={16} className="text-orange-500" />
              Active Alerts
            </h3>
            <div className="space-y-3">
              {problematicRoutes?.routes?.filter(r => r.averageDelay > 15).slice(0, 3).map((route, index) => (
                <div key={route.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-medium">{route.routeCode}</span>
                  </div>
                  <span className="text-sm text-red-600">
                    {route.averageDelay.toFixed(1)} min delay
                  </span>
                </div>
              ))}
              {(!problematicRoutes?.routes?.filter(r => r.averageDelay > 15).length) && (
                <p className="text-sm text-gray-500 text-center py-3">
                  No critical delays reported
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RoutePerformanceTable data={problematicRoutes?.routes} limit={5} />
        
        {/* Recent Delays */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Delays by Hour</h3>
          <div className="space-y-2">
            {delays?.delays?.slice(0, 5).map((delay, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{delay.route.name}</p>
                  <p className="text-sm text-gray-500">{new Date(delay.hour_bucket).toLocaleTimeString([], { hour: '2-digit' })}:00</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-orange-600">{delay.averageDelay.toFixed(1)} min</p>
                  <p className="text-sm text-gray-500">{delay.tripCount} trips</p>
                </div>
              </div>
            ))}
            {(!delays?.delays?.length) && (
              <p className="text-sm text-gray-500 text-center py-4">
                No delay data available
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
