import { useState, useEffect, useMemo } from 'react'
import { Filter, AlertCircle, Activity, Server } from 'lucide-react'
import { useHourlyMetrics } from '../hooks/useHourlyMetrics'
import { useDailyMetrics } from '../hooks/useDailyMetrics'
import { useAlerts, useCorrelatedAlerts } from '../hooks/useAlerts'
import { HourlyFunnelChart } from '../components/charts/HourlyFunnelChart'
import { DailyDisbursedChart } from '../components/charts/DailyDisbursedChart'
import { HourlyMetricsDataGrid } from '../components/tables/HourlyMetricsDataGrid'
import { AlertsDataGrid } from '../components/tables/AlertsDataGrid'
import { MetricCard } from '../components/cards/MetricCard'
import { KPICard } from '../components/cards/KPICard'
import { Tabs } from '../components/ui/Tabs'
import { FilterModal } from '../components/ui/FilterModal'
import { HourlyMetricField } from '../lib/types'
import { supabaseApi } from '../lib/supabaseApi'
import { formatPercent } from '../lib/utils'

export function Dashboard() {
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedMetric, setSelectedMetric] = useState<HourlyMetricField>('applications_created')
  const [windowBefore, setWindowBefore] = useState(60)
  const [windowAfter, setWindowAfter] = useState(15)
  const [selectedAnomalyHour, setSelectedAnomalyHour] = useState<number | null>(null)
  const [selectedAnomalyTimestamp, setSelectedAnomalyTimestamp] = useState<Date | null>(null)
  
  // Alert filters
  const [alertSources, setAlertSources] = useState<string[]>([])
  const [alertPriority, setAlertPriority] = useState<string[]>([])
  const [alertSeverity, setAlertSeverity] = useState<string[]>([])
  const [alertSearchText, setAlertSearchText] = useState('')
  
  // Daily chart toggles
  const [showApproved, setShowApproved] = useState(false)
  const [showSubmitted, setShowSubmitted] = useState(false)

  // Filter modal state
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)

  // Fetch latest DAY-0 date on mount
  useEffect(() => {
    async function fetchLatestDate() {
      const result = await supabaseApi.fetchLatestDate('DAY-0')

      if (result && typeof result === 'object' && 'dt' in result && result.dt) {
        setSelectedDate(String(result.dt))
      } else {
        // Fallback to today
        setSelectedDate(new Date().toISOString().split('T')[0])
      }
    }
    fetchLatestDate()
  }, [])

  const { data: hourlyData, anomalies: hourlyAnomalies, loading: hourlyLoading } = 
    useHourlyMetrics(selectedDate, selectedMetric, 0.30)

  const { data: dailyData, anomalies: dailyAnomalies, loading: dailyLoading } = 
    useDailyMetrics(30)

  // Determine which alerts to show - memoize to prevent infinite re-renders
  const alertFilters = useMemo(() => ({
    sources: alertSources.length > 0 ? alertSources : undefined,
    priority: alertPriority.length > 0 ? alertPriority : undefined,
    severity: alertSeverity.length > 0 ? alertSeverity : undefined,
    searchText: alertSearchText.trim() || undefined
  }), [alertSources, alertPriority, alertSeverity, alertSearchText])

  const { alerts: timeRangeAlerts, loading: alertsLoading } = useAlerts(alertFilters)
  const { alerts: correlatedAlerts, loading: correlatedAlertsLoading } = 
    useCorrelatedAlerts(selectedAnomalyTimestamp, windowBefore, windowAfter, alertFilters)

  const displayAlerts = selectedAnomalyTimestamp ? correlatedAlerts : timeRangeAlerts
  const displayAlertsLoading = selectedAnomalyTimestamp ? correlatedAlertsLoading : alertsLoading

  // Calculate KPIs
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const p1AlertsLastHour = useMemo(() => {
    return displayAlerts.filter(alert => {
      const alertTime = new Date(alert.triggered_at)
      return alert.priority === 'p1' && alertTime >= oneHourAgo
    }).length
  }, [displayAlerts, oneHourAgo])

  const servicesUp = useMemo(() => {
    // Calculate based on alerts - services with no critical alerts in last hour
    const criticalAlerts = displayAlerts.filter(alert => {
      const alertTime = new Date(alert.triggered_at)
      return alert.priority === 'p1' && alertTime >= oneHourAgo
    })
    // Mock calculation - in real app, this would come from service health data
    return Math.max(0, 10 - criticalAlerts.length)
  }, [displayAlerts, oneHourAgo])

  const servicesDown = 10 - servicesUp
  const totalAnomalies = hourlyAnomalies.length + dailyAnomalies.length

  const handleAnomalyHourClick = (hour: number) => {
    setSelectedAnomalyHour(hour)
    // Find the anomaly timestamp for this hour
    const anomaly = hourlyAnomalies.find(a => a.hour === hour)
    if (anomaly) {
      setSelectedAnomalyTimestamp(anomaly.timestamp)
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Monitoring Dashboard</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="P1 Alerts (Last 1 Hour)"
          value={p1AlertsLastHour}
          subtitle="Critical alerts"
          color="red"
          icon={<AlertCircle size={24} />}
        />
        <KPICard
          title="Services Up"
          value={servicesUp}
          subtitle="of 10 total"
          color="green"
          icon={<Server size={24} />}
        />
        <KPICard
          title="Services Down"
          value={servicesDown}
          subtitle="Requires attention"
          color="red"
          icon={<Activity size={24} />}
        />
        <KPICard
          title="Total Anomalies"
          value={totalAnomalies}
          subtitle="Detected today"
          color="blue"
          icon={<AlertCircle size={24} />}
        />
      </div>

      {/* Anomaly Selection Banner */}
      {selectedAnomalyHour !== null && (
        <div className="mb-6 p-3 bg-bharatpe-blue-light border border-bharatpe-blue rounded-lg">
          <span className="text-sm text-bharatpe-blue-dark">
            Showing alerts correlated with anomaly at hour {selectedAnomalyHour}:00
          </span>
          <button
            onClick={() => {
              setSelectedAnomalyHour(null)
              setSelectedAnomalyTimestamp(null)
            }}
            className="ml-4 text-bharatpe-blue hover:text-bharatpe-blue-dark underline text-sm"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Filter Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        selectedDate={selectedDate}
        onDateChange={(value) => {
          setSelectedDate(value)
          setSelectedAnomalyHour(null)
          setSelectedAnomalyTimestamp(null)
        }}
        selectedMetric={selectedMetric}
        onMetricChange={setSelectedMetric}
        windowBefore={windowBefore}
        onWindowBeforeChange={setWindowBefore}
        windowAfter={windowAfter}
        onWindowAfterChange={setWindowAfter}
        alertSources={alertSources}
        onAlertSourcesChange={setAlertSources}
        alertPriority={alertPriority}
        onAlertPriorityChange={setAlertPriority}
        alertSeverity={alertSeverity}
        onAlertSeverityChange={setAlertSeverity}
        alertSearchText={alertSearchText}
        onAlertSearchTextChange={setAlertSearchText}
      />

      {/* Content Tabs */}
      <MetricCard 
        title="Metrics & Alerts"
        actionButton={
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
            aria-label="Open filters"
            title="Filters"
          >
            <Filter size={20} />
          </button>
        }
      >
        <Tabs
          tabs={[
            {
              id: 'hourly',
              label: 'Hourly Metrics',
              content: (
                <>
                  {hourlyLoading ? (
                    <div className="text-center py-8 text-gray-500">Loading hourly metrics...</div>
                  ) : hourlyData.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No data available</div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="lg:col-span-1">
                        <HourlyFunnelChart data={hourlyData} />
                      </div>
                      <div className="lg:col-span-1">
                        <HourlyMetricsDataGrid 
                          data={hourlyData} 
                          onRowClick={handleAnomalyHourClick}
                        />
                      </div>
                    </div>
                  )}
                </>
              )
            },
            {
              id: 'daily',
              label: 'Daily Trends',
              content: (
                <>
                  <div className="mb-4 flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={showApproved}
                        onChange={(e) => setShowApproved(e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Show Approved</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={showSubmitted}
                        onChange={(e) => setShowSubmitted(e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Show Submitted</span>
                    </label>
                  </div>
                  {dailyLoading ? (
                    <div className="text-center py-8 text-gray-500">Loading daily metrics...</div>
                  ) : dailyData.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No data available</div>
                  ) : (
                    <>
                      <DailyDisbursedChart 
                        data={dailyData} 
                        showApproved={showApproved}
                        showSubmitted={showSubmitted}
                      />
                      {dailyAnomalies.length > 0 && (
                        <div className="mt-4">
                          <h3 className="text-sm font-semibold text-gray-700 mb-2">Anomalies Detected:</h3>
                          <div className="flex flex-wrap gap-2">
                            {dailyAnomalies.map((anomaly, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-bharatpe-red-light text-bharatpe-red rounded text-sm"
                              >
                                {new Date(anomaly.dt).toLocaleDateString('en-IN')} ({formatPercent(anomaly.delta)})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )
            },
            {
              id: 'alerts',
              label: 'Alerts Feed',
              content: (
                <AlertsDataGrid alerts={displayAlerts} loading={displayAlertsLoading} />
              )
            }
          ]}
        />
      </MetricCard>
    </div>
  )
}

