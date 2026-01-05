import { useState, useEffect, useMemo } from 'react'
import { useHourlyMetrics } from '../hooks/useHourlyMetrics'
import { useDailyMetrics } from '../hooks/useDailyMetrics'
import { useCorrelatedAlerts } from '../hooks/useAlerts'
import { IncidentCard } from '../components/cards/IncidentCard'
import { Select } from '../components/ui/Select'
import { DatePicker } from '../components/ui/DatePicker'
import { Input } from '../components/ui/Input'
import { HourlyMetricField } from '../lib/types'
import { constructISTDateTime } from '../lib/utils'

type Domain = 'applications' | 'collections'

export function IncidentExplorer() {
  const [domain, setDomain] = useState<Domain>('applications')
  const [metric, setMetric] = useState<string>('applications_created')
  const [date, setDate] = useState<string>('')
  const [hour, setHour] = useState<string>('0')
  const [windowBefore, setWindowBefore] = useState(60)
  const [windowAfter, setWindowAfter] = useState(15)

  const [incidentData, setIncidentData] = useState<{
    currentValue: number
    baselines: { day1?: number; day7?: number; yesterday?: number }
    delta: number | null
    timeframe: string
  } | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Set default date to today
  useEffect(() => {
    if (!date) {
      setDate(new Date().toISOString().split('T')[0])
    }
  }, [date])

  const { data: hourlyData } = useHourlyMetrics(
    domain === 'applications' ? date : '',
    metric as HourlyMetricField,
    0.30
  )

  const { data: dailyData } = useDailyMetrics(30)

  // Compute incident data
  useEffect(() => {
    async function computeIncident() {
      if (!date) return

      setLoading(true)
      setError(null)

      try {
        if (domain === 'applications') {
          // For applications metrics, use hourly data
          const hourNum = parseInt(hour, 10)
          if (isNaN(hourNum) || hourNum < 0 || hourNum > 23) {
            setError('Invalid hour')
            setLoading(false)
            return
          }

          const hourData = hourlyData.find(d => d.hour === hourNum)
          if (!hourData) {
            setError('No data found for selected date and hour')
            setLoading(false)
            return
          }

          setIncidentData({
            currentValue: hourData.day0,
            baselines: {
              day1: hourData.day1,
              day7: hourData.day7
            },
            delta: hourData.deltaDay1 !== null ? hourData.deltaDay1 : hourData.deltaDay7,
            timeframe: `${date} at ${hour}:00 IST`
          })
        } else {
          // For collections/disbursed, use daily data
          const dayData = dailyData.find(d => d.dt === date)
          if (!dayData) {
            setError('No data found for selected date')
            setLoading(false)
            return
          }

          setIncidentData({
            currentValue: dayData.disbursed,
            baselines: {
              yesterday: dayData.prevDisbursed || undefined
            },
            delta: dayData.deltaDisbursed,
            timeframe: date
          })
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to compute incident')
      } finally {
        setLoading(false)
      }
    }

    computeIncident()
  }, [domain, metric, date, hour, hourlyData, dailyData])

  // Get anomaly timestamp for correlation
  const anomalyTimestamp = useMemo(() => {
    if (!incidentData || !date) return null

    if (domain === 'applications') {
      try {
        return constructISTDateTime(date, hour)
      } catch {
        return null
      }
    } else {
      // For daily, use start of day in IST
      return new Date(`${date}T00:00:00+05:30`)
    }
  }, [domain, date, hour, incidentData])

  const { alerts: correlatedAlerts } = useCorrelatedAlerts(
    anomalyTimestamp,
    windowBefore,
    windowAfter
  )

  const handleGenerateSummary = () => {
    if (!incidentData) return

    const top3Alerts = correlatedAlerts.slice(0, 3)
    const summary = generateSummary(incidentData, metric, top3Alerts)
    
    // For now, just alert it (stub implementation)
    alert(summary)
  }

  const metricOptions = domain === 'applications'
    ? [
        { value: 'applications_created', label: 'Applications Created' },
        { value: 'applications_submitted', label: 'Applications Submitted' },
        { value: 'applications_approved', label: 'Applications Approved' }
      ]
    : [
        { value: 'disbursed', label: 'Disbursed' }
      ]

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Incident Explorer</h1>

        {/* Selection Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <Select
              label="Domain"
              value={domain}
              onChange={(e) => {
                setDomain(e.target.value as Domain)
                if (e.target.value === 'applications') {
                  setMetric('applications_created')
                } else {
                  setMetric('disbursed')
                }
              }}
              options={[
                { value: 'applications', label: 'Applications' },
                { value: 'collections', label: 'Collections' }
              ]}
            />
            <Select
              label="Metric"
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              options={metricOptions}
            />
            <DatePicker
              label="Date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            {domain === 'applications' && (
              <Select
                label="Hour"
                value={hour}
                onChange={(e) => setHour(e.target.value)}
                options={Array.from({ length: 24 }, (_, i) => ({
                  value: i.toString(),
                  label: `${i}:00`
                }))}
              />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Correlation Window Before (mins)"
              type="number"
              value={windowBefore.toString()}
              onChange={(e) => setWindowBefore(parseInt(e.target.value) || 60)}
            />
            <Input
              label="Correlation Window After (mins)"
              type="number"
              value={windowAfter.toString()}
              onChange={(e) => setWindowAfter(parseInt(e.target.value) || 15)}
            />
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-bharatpe-red-light border border-bharatpe-red rounded-lg p-4 mb-6">
            <div className="text-bharatpe-red">{error}</div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="text-center py-8 text-gray-500">Computing incident data...</div>
          </div>
        )}

        {/* Incident Card */}
        {incidentData && !loading && (
          <IncidentCard
            metric={metric}
            timeframe={incidentData.timeframe}
            currentValue={incidentData.currentValue}
            baselines={incidentData.baselines}
            delta={incidentData.delta}
            correlatedAlerts={correlatedAlerts}
            onGenerateSummary={handleGenerateSummary}
          />
        )}
      </div>
  )
}

/**
 * Generate deterministic summary from top alerts + deviation
 * This is a stub implementation for phase-1
 */
function generateSummary(
  incidentData: {
    currentValue: number
    baselines: { day1?: number; day7?: number; yesterday?: number }
    delta: number | null
    timeframe: string
  },
  metric: string,
  topAlerts: any[]
): string {
  const lines: string[] = []
  
  lines.push(`INCIDENT SUMMARY`)
  lines.push(`================`)
  lines.push(``)
  lines.push(`Metric: ${metric}`)
  lines.push(`Timeframe: ${incidentData.timeframe}`)
  lines.push(`Current Value: ${incidentData.currentValue.toLocaleString()}`)
  
  if (incidentData.baselines.day1 !== undefined) {
    lines.push(`DAY-1 Baseline: ${incidentData.baselines.day1.toLocaleString()}`)
  }
  if (incidentData.baselines.day7 !== undefined) {
    lines.push(`DAY-7 Baseline: ${incidentData.baselines.day7.toLocaleString()}`)
  }
  if (incidentData.baselines.yesterday !== undefined) {
    lines.push(`Yesterday: ${incidentData.baselines.yesterday.toLocaleString()}`)
  }
  
  if (incidentData.delta !== null) {
    lines.push(`Deviation: ${incidentData.delta >= 0 ? '+' : ''}${incidentData.delta.toFixed(2)}%`)
  }
  
  lines.push(``)
  lines.push(`Top Correlated Alerts (${topAlerts.length}):`)
  
  topAlerts.forEach((alert, index) => {
    lines.push(`${index + 1}. [${alert.priority}] ${alert.alert_name || 'Unnamed'} (${alert.source})`)
    if (alert.message) {
      lines.push(`   ${alert.message.substring(0, 100)}${alert.message.length > 100 ? '...' : ''}`)
    }
  })
  
  return lines.join('\n')
}

