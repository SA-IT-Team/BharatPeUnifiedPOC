import { useState, useEffect } from 'react'
import { supabaseApi } from '../lib/supabaseApi'
import { AppHourlyMetric, HourlyMetricData, HourlyAnomaly, HourlyMetricField } from '../lib/types'
import { computeHourlyAnomalies } from '../lib/utils'

interface UseHourlyMetricsResult {
  data: HourlyMetricData[]
  anomalies: HourlyAnomaly[]
  loading: boolean
  error: Error | null
}

export function useHourlyMetrics(
  selectedDate: string,
  selectedMetric: HourlyMetricField,
  threshold: number = 0.30
): UseHourlyMetricsResult {
  const [data, setData] = useState<HourlyMetricData[]>([])
  const [anomalies, setAnomalies] = useState<HourlyAnomaly[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(true)
        setError(null)

        // Fetch all cohorts for the selected date
        const metrics = await supabaseApi.fetchHourlyMetrics(selectedDate, ['DAY-0', 'DAY-1', 'DAY-7'])

        if (!metrics || metrics.length === 0) {
          setData([])
          setAnomalies([])
          setLoading(false)
          return
        }

        const typedMetrics = metrics as AppHourlyMetric[]
        const result = computeHourlyAnomalies(typedMetrics, selectedMetric, threshold)
        
        setData(result.data)
        setAnomalies(result.anomalies)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch hourly metrics'))
        setData([])
        setAnomalies([])
      } finally {
        setLoading(false)
      }
    }

    if (selectedDate) {
      fetchMetrics()
    }
  }, [selectedDate, selectedMetric, threshold])

  return { data, anomalies, loading, error }
}

