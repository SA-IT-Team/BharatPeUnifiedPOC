import { 
  AppHourlyMetric, 
  HourlyMetricData, 
  HourlyAnomaly,
  DailyMetricData,
  DailyAnomaly,
  HourlyMetricField,
  HourlyAllMetricsData
} from './types'

/**
 * Safely parse metric value from varchar to number
 * Handles empty/null/NaN -> 0, parseFloat, Number fallback
 */
export function parseMetric(value: string | null | undefined): number {
  if (value === null || value === undefined || value === '') {
    return 0
  }
  
  const trimmed = value.trim()
  if (trimmed === '' || trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'nan') {
    return 0
  }
  
  const parsed = parseFloat(trimmed)
  if (!isNaN(parsed)) {
    return parsed
  }
  
  const numFallback = Number(trimmed)
  return isNaN(numFallback) ? 0 : numFallback
}

/**
 * Convert timestamptz to IST (Asia/Kolkata) Date
 */
export function toIST(timestamp: string): Date {
  const date = new Date(timestamp)
  // Convert to IST (UTC+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000
  const utc = date.getTime() + (date.getTimezoneOffset() * 60 * 1000)
  return new Date(utc + istOffset)
}

/**
 * Format Date to IST string for display
 */
export function formatIST(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date)
}

/**
 * Construct IST datetime from date string and hour
 * Assumes dt is in YYYY-MM-DD format and hour is "0".."23"
 */
export function constructISTDateTime(dt: string, hour: string): Date {
  const hourNum = parseInt(hour, 10)
  if (isNaN(hourNum) || hourNum < 0 || hourNum > 23) {
    throw new Error(`Invalid hour: ${hour}`)
  }
  
  // Create date string in IST format
  const dateTimeStr = `${dt}T${hour.padStart(2, '0')}:00:00+05:30`
  return new Date(dateTimeStr)
}

/**
 * Compute hourly data for a single date (no comparison)
 */
export function computeSingleDateHourlyMetrics(
  metrics: AppHourlyMetric[],
  selectedMetric: HourlyMetricField
): { data: HourlyMetricData[]; anomalies: HourlyAnomaly[] } {
  const dataByHour: Map<number, number> = new Map()
  
  // Initialize all hours 0-23
  for (let h = 0; h < 24; h++) {
    dataByHour.set(h, 0)
  }
  
  // Group by hour
  metrics.forEach(metric => {
    const hour = parseInt(metric.hour, 10)
    if (isNaN(hour) || hour < 0 || hour > 23) return
    
    const value = parseMetric(metric[selectedMetric])
    dataByHour.set(hour, value)
  })
  
  // Compute data and detect anomalies (compare with previous hour)
  const data: HourlyMetricData[] = []
  const anomalies: HourlyAnomaly[] = []
  let prevValue: number | null = null
  
  dataByHour.forEach((value, hour) => {
    const delta = prevValue !== null && prevValue !== 0 
      ? ((value - prevValue) / prevValue) * 100 
      : null
    
    // Anomaly: significant drop (>30%) compared to previous hour
    const isAnomaly = delta !== null && delta < -30
    
    data.push({
      hour,
      day0: value,
      day1: 0, // Not used for single date
      day7: 0, // Not used for single date
      deltaDay1: null,
      deltaDay7: delta,
      isAnomaly
    })
    
    if (isAnomaly && metrics.length > 0) {
      const metric = metrics.find(m => parseInt(m.hour, 10) === hour)
      if (metric) {
        anomalies.push({
          hour,
          metric: selectedMetric,
          day0Value: value,
          day1Value: prevValue || 0,
          day7Value: 0,
          deltaDay1: null,
          deltaDay7: delta,
          timestamp: constructISTDateTime(metric.dt, metric.hour)
        })
      }
    }
    
    prevValue = value
  })
  
  // Sort by hour
  data.sort((a, b) => a.hour - b.hour)
  anomalies.sort((a, b) => a.hour - b.hour)
  
  return { data, anomalies }
}

/**
 * Compute all hourly metrics for a single date
 */
export function computeAllHourlyMetrics(
  metrics: AppHourlyMetric[]
): HourlyAllMetricsData[] {
  const dataByHour: Map<number, HourlyAllMetricsData> = new Map()
  
  // Initialize all hours 0-23
  for (let h = 0; h < 24; h++) {
    dataByHour.set(h, {
      hour: h,
      applications_created: 0,
      applications_submitted: 0,
      applications_pending: 0,
      applications_approved: 0,
      applications_nached: 0,
      autopay_done_applications: 0,
      isAnomaly: false
    })
  }
  
  // Group by hour and aggregate all metrics
  metrics.forEach(metric => {
    const hour = parseInt(metric.hour, 10)
    if (isNaN(hour) || hour < 0 || hour > 23) return
    
    const hourData = dataByHour.get(hour)!
    hourData.applications_created = parseMetric(metric.applications_created)
    hourData.applications_submitted = parseMetric(metric.applications_submitted)
    hourData.applications_pending = parseMetric(metric.applications_pending)
    hourData.applications_approved = parseMetric(metric.applications_approved)
    hourData.applications_nached = parseMetric(metric.applications_nached)
    hourData.autopay_done_applications = parseMetric(metric.autopay_done_applications)
  })
  
  // Detect anomalies (significant drop in created compared to previous hour)
  const data: HourlyAllMetricsData[] = []
  let prevCreated: number | null = null
  
  dataByHour.forEach((hourData) => {
    const delta = prevCreated !== null && prevCreated !== 0 
      ? ((hourData.applications_created - prevCreated) / prevCreated) * 100 
      : null
    
    // Anomaly: significant drop (>30%) in created compared to previous hour
    hourData.isAnomaly = delta !== null && delta < -30
    
    data.push(hourData)
    prevCreated = hourData.applications_created
  })
  
  // Sort by hour (ascending)
  data.sort((a, b) => a.hour - b.hour)
  
  return data
}

/**
 * Compute hourly anomalies by joining DAY-0/DAY-1/DAY-7 by hour (legacy - not used anymore)
 */
export function computeHourlyAnomalies(
  metrics: AppHourlyMetric[],
  selectedMetric: HourlyMetricField,
  threshold: number = 0.30
): { data: HourlyMetricData[]; anomalies: HourlyAnomaly[] } {
  const dataByHour: Map<number, { day0?: number; day1?: number; day7?: number }> = new Map()
  
  // Initialize all hours 0-23
  for (let h = 0; h < 24; h++) {
    dataByHour.set(h, {})
  }
  
  // Group by hour and cohort
  metrics.forEach(metric => {
    const hour = parseInt(metric.hour, 10)
    if (isNaN(hour) || hour < 0 || hour > 23) return
    
    const value = parseMetric(metric[selectedMetric])
    
    if (!dataByHour.has(hour)) {
      dataByHour.set(hour, {})
    }
    
    const hourData = dataByHour.get(hour)!
    if (metric.cohort === 'DAY-0') {
      hourData.day0 = value
    } else if (metric.cohort === 'DAY-1') {
      hourData.day1 = value
    } else if (metric.cohort === 'DAY-7') {
      hourData.day7 = value
    }
  })
  
  // Compute deltas and anomalies
  const data: HourlyMetricData[] = []
  const anomalies: HourlyAnomaly[] = []
  
  dataByHour.forEach((values, hour) => {
    const day0 = values.day0 ?? 0
    const day1 = values.day1 ?? 0
    const day7 = values.day7 ?? 0
    
    // Compute percentage deltas (divide-by-zero safe)
    const deltaDay1 = day1 !== 0 ? ((day0 - day1) / day1) : null
    const deltaDay7 = day7 !== 0 ? ((day0 - day7) / day7) : null
    
    // Check for anomaly (drop > threshold)
    const isAnomaly = 
      (deltaDay1 !== null && deltaDay1 < -threshold) ||
      (deltaDay7 !== null && deltaDay7 < -threshold)
    
    data.push({
      hour,
      day0,
      day1,
      day7,
      deltaDay1: deltaDay1 !== null ? deltaDay1 * 100 : null,
      deltaDay7: deltaDay7 !== null ? deltaDay7 * 100 : null,
      isAnomaly
    })
    
    if (isAnomaly) {
      // Find the dt from metrics for this hour and DAY-0
      const day0Metric = metrics.find(
        m => m.cohort === 'DAY-0' && parseInt(m.hour, 10) === hour
      )
      
      if (day0Metric) {
        anomalies.push({
          hour,
          metric: selectedMetric,
          day0Value: day0,
          day1Value: day1,
          day7Value: day7,
          deltaDay1: deltaDay1 !== null ? deltaDay1 * 100 : null,
          deltaDay7: deltaDay7 !== null ? deltaDay7 * 100 : null,
          timestamp: constructISTDateTime(day0Metric.dt, day0Metric.hour)
        })
      }
    }
  })
  
  // Sort by hour
  data.sort((a, b) => a.hour - b.hour)
  anomalies.sort((a, b) => a.hour - b.hour)
  
  return { data, anomalies }
}

/**
 * Compute daily anomalies for disbursed trend
 */
export function computeDailyAnomalies(
  metrics: DailyMetricData[],
  threshold: number = 0.30
): DailyAnomaly[] {
  const anomalies: DailyAnomaly[] = []
  
  for (let i = 1; i < metrics.length; i++) {
    const current = metrics[i]
    const prev = metrics[i - 1]
    
    if (current.prevDisbursed !== null && current.deltaDisbursed !== null) {
      if (current.deltaDisbursed < -threshold * 100) {
        anomalies.push({
          dt: current.dt,
          metric: 'disbursed',
          currentValue: current.disbursed,
          prevValue: prev.disbursed,
          delta: current.deltaDisbursed
        })
      }
    }
  }
  
  return anomalies
}

/**
 * Format percentage for display
 */
export function formatPercent(value: number | null): string {
  if (value === null) return 'N/A'
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

