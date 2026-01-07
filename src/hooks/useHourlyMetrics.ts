import { useState, useEffect } from 'react'
import { supabaseApi } from '../lib/supabaseApi'
import { AppHourlyMetric, HourlyAllMetricsData } from '../lib/types'
import { computeAllHourlyMetrics } from '../lib/utils'

interface UseHourlyMetricsResult {
  data: HourlyAllMetricsData[]
  loading: boolean
  error: Error | null
}

export function useHourlyMetrics(
  selectedDate: string
): UseHourlyMetricsResult {
  const [data, setData] = useState<HourlyAllMetricsData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(true)
        setError(null)

        // Fetch selected date
        const metrics = await supabaseApi.fetchHourlyMetrics(selectedDate)

        if (!metrics || metrics.length === 0) {
          setData([])
          setLoading(false)
          return
        }

        const typedMetrics = metrics as AppHourlyMetric[]
        const result = computeAllHourlyMetrics(typedMetrics)
        
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch hourly metrics'))
        setData([])
      } finally {
        setLoading(false)
      }
    }

    if (selectedDate) {
      fetchMetrics()
    }
  }, [selectedDate])

  return { data, loading, error }
}

