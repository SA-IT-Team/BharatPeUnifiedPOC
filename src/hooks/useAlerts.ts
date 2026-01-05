import { useState, useEffect, useCallback } from 'react'
import { supabaseApi } from '../lib/supabaseApi'
import { BharatPeAlertEvent, CorrelatedAlert } from '../lib/types'

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
 */
export function useCorrelatedAlerts(
  anomalyTimestamp: Date | null, // IST
  windowBeforeMinutes: number = 60,
  windowAfterMinutes: number = 15,
  filters?: AlertFilters
): UseAlertsResult {
  const [timeWindow, setTimeWindow] = useState<TimeWindow | undefined>()

  useEffect(() => {
    if (anomalyTimestamp) {
      const start = new Date(anomalyTimestamp.getTime() - windowBeforeMinutes * 60 * 1000)
      const end = new Date(anomalyTimestamp.getTime() + windowAfterMinutes * 60 * 1000)
      setTimeWindow({ start, end })
    } else {
      setTimeWindow(undefined)
    }
  }, [anomalyTimestamp, windowBeforeMinutes, windowAfterMinutes])

  return useAlerts(filters, timeWindow)
}

