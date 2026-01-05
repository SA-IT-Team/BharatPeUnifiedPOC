import { useState, useEffect } from 'react'
import { supabaseApi } from '../lib/supabaseApi'
import { DayByDayAmountMetric, DailyMetricData, DailyAnomaly } from '../lib/types'
import { parseMetric, computeDailyAnomalies } from '../lib/utils'

interface UseDailyMetricsResult {
  data: DailyMetricData[]
  anomalies: DailyAnomaly[]
  loading: boolean
  error: Error | null
}

export function useDailyMetrics(days: number = 30): UseDailyMetricsResult {
  const [data, setData] = useState<DailyMetricData[]>([])
  const [anomalies, setAnomalies] = useState<DailyAnomaly[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(true)
        setError(null)

        // Calculate date range
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        const startDateStr = startDate.toISOString().split('T')[0]
        const endDateStr = endDate.toISOString().split('T')[0]

        const metrics = await supabaseApi.fetchDailyMetrics(startDateStr, endDateStr)

        if (!metrics || metrics.length === 0) {
          setData([])
          setAnomalies([])
          setLoading(false)
          return
        }

        const typedMetrics = metrics as DayByDayAmountMetric[]
        
        // Transform to DailyMetricData
        const transformedData: DailyMetricData[] = typedMetrics.map((metric, index) => {
          const disbursed = parseMetric(metric.disbursed)
          const approved = parseMetric(metric.approved)
          const submitted = parseMetric(metric.submitted)
          
          const prevDisbursed = index > 0 
            ? parseMetric(typedMetrics[index - 1].disbursed)
            : null
          
          const deltaDisbursed = prevDisbursed !== null && prevDisbursed !== 0
            ? ((disbursed - prevDisbursed) / prevDisbursed) * 100
            : null
          
          return {
            dt: metric.dt,
            disbursed,
            approved,
            submitted,
            prevDisbursed,
            deltaDisbursed,
            isAnomaly: deltaDisbursed !== null && deltaDisbursed < -30
          }
        })

        const computedAnomalies = computeDailyAnomalies(transformedData, 0.30)
        
        setData(transformedData)
        setAnomalies(computedAnomalies)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch daily metrics'))
        setData([])
        setAnomalies([])
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [days])

  return { data, anomalies, loading, error }
}

