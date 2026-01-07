import { useState, useEffect, useMemo } from 'react'
import { Filter, AlertCircle, Activity, Server } from 'lucide-react'
import { useHourlyMetrics } from '../hooks/useHourlyMetrics'
import { useDailyMetrics } from '../hooks/useDailyMetrics'
import { useAlerts, useCorrelatedAlerts } from '../hooks/useAlerts'
import { HourlyFunnelChart } from '../components/charts/HourlyFunnelChart'
import { HourlyAllMetricsChart } from '../components/charts/HourlyAllMetricsChart'
import { DailyMetricsChart } from '../components/charts/DailyMetricsChart'
import { HourlyMetricsDataGrid } from '../components/tables/HourlyMetricsDataGrid'
import { DailyMetricsDataGrid } from '../components/tables/DailyMetricsDataGrid'
import { AlertsDataGrid } from '../components/tables/AlertsDataGrid'
import { MetricCard } from '../components/cards/MetricCard'
import { KPICard } from '../components/cards/KPICard'
import { Tabs } from '../components/ui/Tabs'
import { FilterModal } from '../components/ui/FilterModal'
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorDisplay } from '../components/ui/ErrorDisplay'
import { AlertCorrelationPanel } from '../components/ui/AlertCorrelationPanel'
import { Accordion } from '../components/ui/Accordion'
import { HourlyMetricField } from '../lib/types'
import { supabaseApi } from '../lib/supabaseApi'
import { formatPercent } from '../lib/utils'
import { validateDate, validateTimeWindow } from '../lib/validation'

export function Dashboard() {
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedMetric, setSelectedMetric] = useState<HourlyMetricField>('applications_created')
  const [windowBefore, setWindowBefore] = useState(60)
  const [windowAfter, setWindowAfter] = useState(15)
  const [selectedAnomalyHour, setSelectedAnomalyHour] = useState<number | null>(null)
  const [selectedAnomalyTimestamp, setSelectedAnomalyTimestamp] = useState<Date | null>(null)
  const [selectedDailyAnomalyDate, setSelectedDailyAnomalyDate] = useState<string | null>(null)
  
  // Alert filters
  const [alertSources, setAlertSources] = useState<string[]>([])
  const [alertPriority, setAlertPriority] = useState<string[]>([])
  const [alertSeverity, setAlertSeverity] = useState<string[]>([])
  const [alertSearchText, setAlertSearchText] = useState('')
  
  // Daily metrics toggles
  const [selectedDailyMetrics, setSelectedDailyMetrics] = useState<string[]>([
    'disbursed', 'approved', 'submitted', 'kyc_completed', 'nach_done'
  ])
  
  // Hourly metrics toggles
  const [selectedHourlyMetrics, setSelectedHourlyMetrics] = useState<string[]>([
    'applications_created', 'applications_submitted', 'applications_pending', 
    'applications_approved', 'applications_nached', 'autopay_done_applications'
  ])

  // Filter modal state
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)

  // Set present date as 23-12-2025
  useEffect(() => {
    setSelectedDate('2025-12-23')
  }, [])

  const { data: hourlyData, loading: hourlyLoading, error: hourlyError } = 
    useHourlyMetrics(selectedDate)

  const { data: dailyData, anomalies: dailyAnomalies, loading: dailyLoading, error: dailyError } = 
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
    useCorrelatedAlerts(
      selectedAnomalyTimestamp, 
      windowBefore, 
      windowAfter, 
      alertFilters,
      selectedDailyAnomalyDate ? 'collections' : 'applications', // domain based on anomaly type
      selectedDailyAnomalyDate ? 'disbursed' : 'applications_created' // metric based on anomaly type
    )

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

  // Calculate unique services/applications from alerts
  const uniqueServices = useMemo(() => {
    const services = new Set<string>()
    displayAlerts.forEach(alert => {
      if (alert.application) services.add(alert.application)
      if (alert.subsystem) services.add(alert.subsystem)
    })
    return Array.from(services)
  }, [displayAlerts])

  const servicesWithCriticalAlerts = useMemo(() => {
    const criticalServices = new Set<string>()
    displayAlerts.forEach(alert => {
      const alertTime = new Date(alert.triggered_at)
      if (alert.priority === 'p1' && alertTime >= oneHourAgo) {
        if (alert.application) criticalServices.add(alert.application)
        if (alert.subsystem) criticalServices.add(alert.subsystem)
      }
    })
    return criticalServices.size
  }, [displayAlerts, oneHourAgo])

  const servicesUp = Math.max(0, uniqueServices.length - servicesWithCriticalAlerts)
  const servicesDown = servicesWithCriticalAlerts
  const totalAnomalies = dailyAnomalies.length

  const handleAnomalyHourClick = (hour: number) => {
    setSelectedAnomalyHour(hour)
    // Create timestamp for the selected hour on the selected date
    const anomalyDate = new Date(selectedDate + `T${hour.toString().padStart(2, '0')}:00:00+05:30`)
    setSelectedAnomalyTimestamp(anomalyDate)
  }

  const selectedAnomalyData = useMemo(() => {
    if (selectedAnomalyTimestamp && selectedAnomalyHour !== null) {
      const hourlyItem = hourlyData.find(a => a.hour === selectedAnomalyHour)
      if (hourlyItem && hourlyItem.isAnomaly) {
        return {
          type: 'hourly' as const,
          time: `${selectedAnomalyHour}:00`,
          metric: 'applications_created',
          delta: null
        }
      }
    }
    if (selectedDailyAnomalyDate) {
      const anomaly = dailyAnomalies.find(a => a.dt === selectedDailyAnomalyDate)
      if (anomaly) {
        return {
          type: 'daily' as const,
          time: new Date(anomaly.dt).toLocaleDateString('en-IN'),
          metric: anomaly.metric,
          delta: anomaly.delta
        }
      }
    }
    return null
  }, [selectedAnomalyTimestamp, selectedAnomalyHour, hourlyData, selectedDailyAnomalyDate, dailyAnomalies])

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">BharatPe Loan Service Monitoring</h1>
        <p className="text-sm text-gray-600 mt-1">Applications & Collections Metrics Dashboard</p>
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
          subtitle={`of ${uniqueServices.length} total`}
          color="green"
          icon={<Server size={24} />}
        />
        <KPICard
          title="Services Down"
          value={servicesDown}
          subtitle="With critical alerts"
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
      {(selectedAnomalyHour !== null || selectedDailyAnomalyDate) && (
        <div className="mb-6 p-3 bg-bharatpe-blue-light border border-bharatpe-blue rounded-lg">
          <span className="text-sm text-bharatpe-blue-dark">
            {selectedAnomalyHour !== null 
              ? `Showing alerts correlated with anomaly at hour ${selectedAnomalyHour}:00`
              : selectedDailyAnomalyDate 
                ? `Showing alerts correlated with anomaly on ${new Date(selectedDailyAnomalyDate).toLocaleDateString('en-IN')}`
                : ''}
          </span>
          <button
            onClick={() => {
              setSelectedAnomalyHour(null)
              setSelectedAnomalyTimestamp(null)
              setSelectedDailyAnomalyDate(null)
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
          const validation = validateDate(value)
          if (validation.valid) {
            setSelectedDate(value)
            setSelectedAnomalyHour(null)
            setSelectedAnomalyTimestamp(null)
            setSelectedDailyAnomalyDate(null)
          } else {
            // Show error but don't update date
            console.warn('Invalid date:', validation.error)
          }
        }}
        selectedMetric={selectedMetric}
        onMetricChange={setSelectedMetric}
        windowBefore={windowBefore}
        onWindowBeforeChange={(value) => {
          const validation = validateTimeWindow(value, windowAfter)
          if (validation.valid) {
            setWindowBefore(value)
          }
        }}
        windowAfter={windowAfter}
        onWindowAfterChange={(value) => {
          const validation = validateTimeWindow(windowBefore, value)
          if (validation.valid) {
            setWindowAfter(value)
          }
        }}
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
              id: 'daily',
              label: 'Day-by-Day Metrics (01-12-2025 to 23-12-2025)',
              content: (
                <>
                  {dailyError ? (
                    <ErrorDisplay 
                      error={dailyError} 
                      onRetry={() => window.location.reload()}
                      title="Failed to Load Day-by-Day Metrics"
                    />
                  ) : dailyLoading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <LoadingSkeleton type="chart" />
                      <LoadingSkeleton type="table" count={5} />
                    </div>
                  ) : dailyData.length === 0 ? (
                    <EmptyState 
                      type="no-data"
                      message="No day-by-day metrics found for the selected date range (01-12-2025 to 23-12-2025)."
                    />
                  ) : (
                    <>
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-3">Select metrics to display (with 7-day forecast):</p>
                        <div className="flex flex-wrap gap-4">
                          {['eligible', 'started', 'kyc_initiated', 'kyc_completed', 'nach_initiated', 'nach_done', 'processed', 'approved', 'submitted', 'disbursed'].map(metric => (
                            <label key={metric} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={selectedDailyMetrics.includes(metric)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedDailyMetrics([...selectedDailyMetrics, metric])
                                  } else {
                                    setSelectedDailyMetrics(selectedDailyMetrics.filter(m => m !== metric))
                                  }
                                }}
                                className="mr-2"
                              />
                              <span className="text-sm text-gray-700 capitalize">{metric.replace(/_/g, ' ')}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="mb-6">
                        <Accordion title="Chart" defaultExpanded={true}>
                          <DailyMetricsChart 
                            data={dailyData} 
                            selectedMetrics={selectedDailyMetrics}
                            showForecast={true}
                            onAnomalyClick={(date) => {
                              setSelectedDailyAnomalyDate(date)
                              const anomalyDate = new Date(date + 'T12:00:00+05:30')
                              setSelectedAnomalyTimestamp(anomalyDate)
                              setSelectedAnomalyHour(null)
                            }}
                          />
                        </Accordion>
                      </div>
                      <div className="mt-6">
                        <DailyMetricsDataGrid 
                          data={dailyData}
                          onRowClick={(date) => {
                            setSelectedDailyAnomalyDate(date)
                            const anomalyDate = new Date(date + 'T12:00:00+05:30')
                            setSelectedAnomalyTimestamp(anomalyDate)
                            setSelectedAnomalyHour(null)
                          }}
                        />
                      </div>
                    </>
                  )}
                </>
              )
            },
            {
              id: 'hourly',
              label: 'Application Metrics (Hourly) - 23-12-2025',
              content: (
                <>
                  {hourlyError ? (
                    <ErrorDisplay 
                      error={hourlyError} 
                      onRetry={() => window.location.reload()}
                      title="Failed to Load Hourly Application Metrics"
                    />
                  ) : hourlyLoading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <LoadingSkeleton type="chart" />
                      <LoadingSkeleton type="table" count={5} />
                    </div>
                  ) : hourlyData.length === 0 ? (
                    <EmptyState 
                      type="no-data"
                      message={`No hourly application metrics found for 23-12-2025.`}
                    />
                  ) : (
                    <>
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-3">Select metrics to display:</p>
                        <div className="flex flex-wrap gap-4">
                          {['applications_created', 'applications_submitted', 'applications_pending', 'applications_approved', 'applications_nached', 'autopay_done_applications'].map(metric => (
                            <label key={metric} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={selectedHourlyMetrics.includes(metric)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedHourlyMetrics([...selectedHourlyMetrics, metric])
                                  } else {
                                    setSelectedHourlyMetrics(selectedHourlyMetrics.filter(m => m !== metric))
                                  }
                                }}
                                className="mr-2"
                              />
                              <span className="text-sm text-gray-700 capitalize">
                                {metric === 'applications_created' ? 'Created' :
                                 metric === 'applications_submitted' ? 'Submitted' :
                                 metric === 'applications_pending' ? 'Pending' :
                                 metric === 'applications_approved' ? 'Approved' :
                                 metric === 'applications_nached' ? 'NACHed' :
                                 metric === 'autopay_done_applications' ? 'Autopay Done' : metric}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="mb-6">
                        <Accordion title="Chart" defaultExpanded={true}>
                          <HourlyAllMetricsChart 
                            data={hourlyData} 
                            selectedMetrics={selectedHourlyMetrics}
                            onAnomalyClick={handleAnomalyHourClick}
                          />
                        </Accordion>
                      </div>
                      <div className="mt-6">
                        <HourlyMetricsDataGrid 
                          data={hourlyData} 
                          onRowClick={handleAnomalyHourClick}
                        />
                      </div>
                    </>
                  )}
                </>
              )
            },
            {
              id: 'alerts',
              label: 'Alerts Feed',
              content: (
                <>
                  {displayAlertsLoading ? (
                    <LoadingSkeleton type="table" count={5} />
                  ) : displayAlerts.length === 0 ? (
                    <EmptyState 
                      type="no-alerts"
                      message={selectedAnomalyTimestamp 
                        ? "No alerts found in the correlation window. Try adjusting the time window or filters."
                        : "No alerts match your current filters. Try adjusting your search criteria or time range."}
                      action={{
                        label: 'Open Filters',
                        onClick: () => setIsFilterModalOpen(true)
                      }}
                    />
                  ) : (
                    <>
                      {selectedAnomalyData && (
                        <AlertCorrelationPanel
                          alerts={correlatedAlerts}
                          anomalyType={selectedAnomalyData.type}
                          anomalyTime={selectedAnomalyData.time}
                          metric={selectedAnomalyData.metric}
                          delta={selectedAnomalyData.delta}
                        />
                      )}
                      <div className="mt-4">
                        <AlertsDataGrid alerts={displayAlerts} loading={displayAlertsLoading} />
                      </div>
                    </>
                  )}
                </>
              )
            }
          ]}
        />
      </MetricCard>
    </div>
  )
}

