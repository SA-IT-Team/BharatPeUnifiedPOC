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

        // Calculate date range - for production POC, use fixed range: 01-12-2025 to 23-12-2025
        // This represents the past 22 days from present day (23-12-2025)
        const startDateStr = '2025-12-01'
        const endDateStr = '2025-12-23'

        const metrics = await supabaseApi.fetchDailyMetrics(startDateStr, endDateStr)

        if (!metrics || metrics.length === 0) {
          setData([])
          setAnomalies([])
          setLoading(false)
          return
        }

        const typedMetrics = metrics as DayByDayAmountMetric[]
        
        // Transform to DailyMetricData with all collection funnel metrics
        const transformedData: DailyMetricData[] = typedMetrics.map((metric, index) => {
          // Parse all collection metrics
          const eligible = parseMetric(metric.eligible)
          const started = parseMetric(metric.started)
          const shop_details_page = parseMetric(metric.shop_details_page)
          const shop_photo = parseMetric(metric.shop_photo)
          const kyc_initiated = parseMetric(metric.kyc_initiated)
          const kyc_completed = parseMetric(metric.kyc_completed)
          const add_detials_submitted = parseMetric(metric.add_detials_submitted)
          const ref_page_submitted = parseMetric(metric.ref_page_submitted)
          const submitted = parseMetric(metric.submitted)
          const nach_initiated = parseMetric(metric.nach_initiated)
          const nach_done = parseMetric(metric.nach_done)
          const processed = parseMetric(metric.processed)
          const approved = parseMetric(metric.approved)
          const disbursed = parseMetric(metric.disbursed)
          
          const prevDisbursed = index > 0 
            ? parseMetric(typedMetrics[index - 1].disbursed)
            : null
          
          const deltaDisbursed = prevDisbursed !== null && prevDisbursed !== 0
            ? ((disbursed - prevDisbursed) / prevDisbursed) * 100
            : null
          
          return {
            dt: metric.dt,
            eligible,
            started,
            shop_details_page,
            shop_photo,
            kyc_initiated,
            kyc_completed,
            add_detials_submitted,
            ref_page_submitted,
            submitted,
            nach_initiated,
            nach_done,
            processed,
            approved,
            disbursed,
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

