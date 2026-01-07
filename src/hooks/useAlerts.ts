import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabaseApi } from '../lib/supabaseApi'
import { BharatPeAlertEvent, CorrelatedAlert, AlertMetricMap } from '../lib/types'

interface AlertFilters {
  sources?: string[]
  priority?: string[]
  severity?: string[]
  searchText?: string
}

interface TimeWindow {
  start?: Date // IST
  end?: Date // IST
}

interface UseAlertsResult {
  alerts: CorrelatedAlert[]
  loading: boolean
  error: Error | null
  refetch: () => void
}

export function useAlerts(
  filters?: AlertFilters,
  timeWindow?: TimeWindow
): UseAlertsResult {
  const [alerts, setAlerts] = useState<CorrelatedAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Apply time window filter
      const timeWindowForApi = timeWindow?.start && timeWindow?.end
        ? {
            start: new Date(timeWindow.start.getTime() - (5.5 * 60 * 60 * 1000)),
            end: new Date(timeWindow.end.getTime() - (5.5 * 60 * 60 * 1000))
          }
        : undefined

      const fetchedAlerts = await supabaseApi.fetchAlerts(timeWindowForApi)

      if (!fetchedAlerts) {
        setAlerts([])
        setLoading(false)
        return
      }

      let filteredAlerts = fetchedAlerts as BharatPeAlertEvent[]

      // Apply source filter
      if (filters?.sources && filters.sources.length > 0) {
        filteredAlerts = filteredAlerts.filter(alert =>
          filters.sources!.includes(alert.source)
        )
      }

      // Apply priority filter
      if (filters?.priority && filters.priority.length > 0) {
        filteredAlerts = filteredAlerts.filter(alert =>
          filters.priority!.includes(alert.priority)
        )
      }

      // Apply severity filter
      if (filters?.severity && filters.severity.length > 0) {
        filteredAlerts = filteredAlerts.filter(alert =>
          alert.severity && filters.severity!.includes(alert.severity)
        )
      }

      // Apply search text filter
      if (filters?.searchText && filters.searchText.trim() !== '') {
        const searchLower = filters.searchText.toLowerCase()
        filteredAlerts = filteredAlerts.filter(alert =>
          alert.alert_name?.toLowerCase().includes(searchLower) ||
          alert.message?.toLowerCase().includes(searchLower) ||
          alert.host?.toLowerCase().includes(searchLower) ||
          alert.path?.toLowerCase().includes(searchLower)
        )
      }

      // Sort by priority (p1 > p2), then value, then recency
      const sortedAlerts: CorrelatedAlert[] = filteredAlerts
        .map(alert => ({ ...alert }))
        .sort((a, b) => {
          // Priority: p1 > p2 > others
          const priorityOrder = { p1: 1, p2: 2 }
          const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 99
          const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 99
          if (aPriority !== bPriority) {
            return aPriority - bPriority
          }

          // Value (higher is more important)
          const aValue = parseFloat(a.value || '0')
          const bValue = parseFloat(b.value || '0')
          if (aValue !== bValue) {
            return bValue - aValue
          }

          // Recency (newer is more important)
          return new Date(b.triggered_at).getTime() - new Date(a.triggered_at).getTime()
        })

      setAlerts(sortedAlerts)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch alerts'))
      setAlerts([])
    } finally {
      setLoading(false)
    }
  }, [filters, timeWindow])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  return {
    alerts,
    loading,
    error,
    refetch: fetchAlerts
  }
}

/**
 * Fetch alerts in correlation window around a timestamp
 * Optionally uses alert_metric_map for domain-based correlation
 * Searches for alerts that occurred exactly at or nearby the anomaly time
 */
export function useCorrelatedAlerts(
  anomalyTimestamp: Date | null, // IST
  windowBeforeMinutes: number = 30, // Default ±30 minutes for nearby alerts
  windowAfterMinutes: number = 30,
  filters?: AlertFilters,
  domain?: string,
  metric?: string
): UseAlertsResult {
  const [timeWindow, setTimeWindow] = useState<TimeWindow | undefined>()
  const [alertMetricMap, setAlertMetricMap] = useState<AlertMetricMap[]>([])

  // Fetch alert metric map - fetch all active mappings for comprehensive correlation
  useEffect(() => {
    supabaseApi.fetchAlertMetricMap(domain)
      .then(maps => setAlertMetricMap(maps as AlertMetricMap[]))
      .catch(() => setAlertMetricMap([]))
  }, [domain])

  useEffect(() => {
    if (anomalyTimestamp) {
      // Search for alerts nearby the anomaly time (±30 minutes by default)
      const start = new Date(anomalyTimestamp.getTime() - windowBeforeMinutes * 60 * 1000)
      const end = new Date(anomalyTimestamp.getTime() + windowAfterMinutes * 60 * 1000)
      setTimeWindow({ start, end })
    } else {
      setTimeWindow(undefined)
    }
  }, [anomalyTimestamp, windowBeforeMinutes, windowAfterMinutes])

  const alertsResult = useAlerts(filters, timeWindow)

  // Enhance alerts with correlation scores and alert mappings if alert_metric_map is available
  const enhancedAlerts = useMemo(() => {
    if (alertMetricMap.length === 0) {
      // Even without metric filter, try to match all mappings
      return alertsResult.alerts.map(alert => {
        const matchedMappings: AlertMetricMap[] = []
        
        alertMetricMap.forEach(map => {
          if (map.is_active !== 'true') return
          
          const matchField = map.match_field
          const matchType = map.match_type
          const matchValue = map.match_value.toLowerCase()
          
          let matches = false
          const alertValue = (alert[matchField as keyof BharatPeAlertEvent] as string || '').toLowerCase()
          
          switch (matchType) {
            case 'contains':
              matches = alertValue.includes(matchValue)
              break
            case 'equals':
              matches = alertValue === matchValue
              break
            case 'regex':
              try {
                matches = new RegExp(matchValue).test(alertValue)
              } catch {
                matches = false
              }
              break
            default:
              matches = false
          }
          
          if (matches) {
            matchedMappings.push(map)
          }
        })
        
        return {
          ...alert,
          alertMappings: matchedMappings.length > 0 ? matchedMappings : undefined
        }
      })
    }

    return alertsResult.alerts.map(alert => {
      let correlationScore = 0
      const matchedMappings: AlertMetricMap[] = []

      // Check if alert matches any mapping rules
      alertMetricMap.forEach(map => {
        if (map.is_active !== 'true') return
        
        // If metric filter is provided, only match if metric matches
        if (metric && map.metric !== metric) return
        
        const matchField = map.match_field
        const matchType = map.match_type
        const matchValue = map.match_value.toLowerCase()

        let matches = false
        const alertValue = (alert[matchField as keyof BharatPeAlertEvent] as string || '').toLowerCase()

        switch (matchType) {
          case 'contains':
            matches = alertValue.includes(matchValue)
            break
          case 'equals':
            matches = alertValue === matchValue
            break
          case 'regex':
            try {
              matches = new RegExp(matchValue).test(alertValue)
            } catch {
              matches = false
            }
            break
          default:
            matches = false
        }

        if (matches) {
          matchedMappings.push(map)
          const confidence = parseFloat(map.confidence || '0.7')
          correlationScore = Math.max(correlationScore, confidence)
        }
      })

      return {
        ...alert,
        correlationScore: correlationScore > 0 ? correlationScore : undefined,
        alertMappings: matchedMappings.length > 0 ? matchedMappings : undefined
      }
    }).sort((a, b) => {
      // Sort by correlation score first (if available), then by existing priority/value/recency
      if (a.correlationScore && b.correlationScore) {
        return b.correlationScore - a.correlationScore
      }
      if (a.correlationScore) return -1
      if (b.correlationScore) return 1

      // Existing sorting logic
      const priorityOrder = { p1: 1, p2: 2 }
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 99
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 99
      if (aPriority !== bPriority) {
        return aPriority - bPriority
      }

      const aValue = parseFloat(a.value || '0')
      const bValue = parseFloat(b.value || '0')
      if (aValue !== bValue) {
        return bValue - aValue
      }

      return new Date(b.triggered_at).getTime() - new Date(a.triggered_at).getTime()
    })
  }, [alertsResult.alerts, alertMetricMap, metric])

  return {
    ...alertsResult,
    alerts: enhancedAlerts
  }
}

