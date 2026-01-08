/**
 * Supabase REST API client
 * Uses PostgREST API directly instead of Supabase JS client
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

const API_BASE = `${supabaseUrl}/rest/v1`

interface QueryParams {
  select?: string
  eq?: Record<string, string | number | string[]>
  in?: Record<string, string[]>
  gte?: Record<string, string>
  lte?: Record<string, string>
  order?: { column: string; ascending?: boolean }
  limit?: number
}

function buildQueryString(params: QueryParams): string {
  const searchParams = new URLSearchParams()

  if (params.select) {
    searchParams.append('select', params.select)
  }

  if (params.eq) {
    Object.entries(params.eq).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        // For arrays, use IN clause instead
        searchParams.append(`${key}`, `in.(${value.join(',')})`)
      } else {
        searchParams.append(`${key}`, `eq.${value}`)
      }
    })
  }

  if (params.in) {
    Object.entries(params.in).forEach(([key, values]) => {
      // PostgREST IN clause format: column=in.(value1,value2,value3)
      // Values are comma-separated, no quotes needed for simple strings
      searchParams.append(`${key}`, `in.(${values.join(',')})`)
    })
  }

  if (params.gte) {
    Object.entries(params.gte).forEach(([key, value]) => {
      searchParams.append(`${key}`, `gte.${value}`)
    })
  }

  if (params.lte) {
    Object.entries(params.lte).forEach(([key, value]) => {
      searchParams.append(`${key}`, `lte.${value}`)
    })
  }

  if (params.order) {
    const direction = params.order.ascending === false ? 'desc' : 'asc'
    searchParams.append('order', `${params.order.column}.${direction}`)
  }

  if (params.limit) {
    searchParams.append('limit', params.limit.toString())
  }

  return searchParams.toString()
}

async function fetchFromSupabase<T>(
  table: string,
  params: QueryParams = {}
): Promise<T[]> {
  const queryString = buildQueryString(params)
  const url = `${API_BASE}/${table}${queryString ? `?${queryString}` : ''}`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(error.message || `HTTP error! status: ${response.status}`)
  }

  return response.json()
}

export const supabaseApi = {
  /**
   * Fetch hourly metrics for a specific date (single date only)
   */
  async fetchHourlyMetrics(date: string) {
    return fetchFromSupabase('bharatpe_app_hourly_metrics', {
      select: '*',
      eq: { dt: date },
      order: { column: 'hour', ascending: true }
    })
  },

  /**
   * Fetch latest date from hourly metrics table
   */
  async fetchLatestDate() {
    const results = await fetchFromSupabase('bharatpe_app_hourly_metrics', {
      select: 'dt',
      order: { column: 'dt', ascending: false },
      limit: 1
    })
    return results[0] || null
  },

  /**
   * Fetch daily metrics within a date range
   */
  async fetchDailyMetrics(startDate: string, endDate: string) {
    return fetchFromSupabase('bharatpe_daybyday_amount_metrics', {
      select: '*',
      gte: { dt: startDate },
      lte: { dt: endDate },
      order: { column: 'dt', ascending: true }
    })
  },

  /**
   * Fetch alerts with optional time window
   * All times are handled in IST (Asia/Kolkata) timezone consistently
   */
  async fetchAlerts(
    timeWindow?: { start: Date; end: Date }
  ) {
    const params: QueryParams = {
      select: '*',
      order: { column: 'triggered_at', ascending: false }
    }

    if (timeWindow?.start && timeWindow?.end) {
      // timeWindow dates are in IST (created with +05:30)
      // Convert to UTC for database query (database stores in UTC)
      const startUTC = timeWindow.start.toISOString()
      const endUTC = timeWindow.end.toISOString()
      
      console.log('Initial query window (UTC):', startUTC, 'to', endUTC)
      console.log('Which is IST:', new Date(startUTC).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), 'to', new Date(endUTC).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }))
      
      params.gte = { triggered_at: startUTC }
      params.lte = { triggered_at: endUTC }
    }

    let alerts = await fetchFromSupabase('bharatpe_alerts_events', params)
    console.log('Initial query found', alerts.length, 'alerts')
    
    // If no alerts found and this is an hourly query, try querying the entire day
    // Then filter alerts by converting everything to IST and comparing
    if (alerts.length === 0 && timeWindow?.start && timeWindow?.end) {
      const windowDuration = timeWindow.end.getTime() - timeWindow.start.getTime()
      // If window is small (hourly ±30min), try querying the entire day
      if (windowDuration < 2 * 60 * 60 * 1000) {
        console.log('No alerts in initial window, trying full day query...')
        const dateStr = timeWindow.start.toISOString().split('T')[0]
        const dayStart = new Date(dateStr + 'T00:00:00Z')
        const dayEnd = new Date(dateStr + 'T23:59:59Z')
        
        console.log('Querying full day:', dayStart.toISOString(), 'to', dayEnd.toISOString())
        
        const dayParams: QueryParams = {
          select: '*',
          gte: { triggered_at: dayStart.toISOString() },
          lte: { triggered_at: dayEnd.toISOString() },
          order: { column: 'triggered_at', ascending: false }
        }
        
        const dayAlerts = await fetchFromSupabase('bharatpe_alerts_events', dayParams)
        console.log('Full day query found', dayAlerts.length, 'alerts')
        
        // Get anomaly hour in IST
        // timeWindow.start represents IST time (12:00 IST = 06:30 UTC)
        // To get IST hour, we need to extract it from the original IST time
        // Since timeWindow.start was created with +05:30, we can get IST hour by:
        // Adding 5.5 hours to the UTC representation to get proper IST
        const anomalyIST = new Date(timeWindow.start.getTime() + 5.5 * 60 * 60 * 1000)
        const anomalyHourIST = anomalyIST.getUTCHours()
        const anomalyMinuteIST = anomalyIST.getUTCMinutes()
        
        console.log('Filtering alerts by IST hour. Anomaly:', anomalyHourIST + ':' + String(anomalyMinuteIST).padStart(2, '0'), 'IST')
        
        // Filter alerts: handle two cases
        // Case 1: Alert stored correctly in UTC (convert to IST and compare)
        // Case 2: Alert stored as IST time without timezone (UTC hour = IST hour)
        const filteredAlerts = (dayAlerts as any[]).filter((alert: any) => {
          const alertUTC = new Date(alert.triggered_at)
          const alertHourUTC = alertUTC.getUTCHours()
          const alertMinuteUTC = alertUTC.getUTCMinutes()
          
          // Convert alert UTC to IST
          const alertIST = new Date(alertUTC.getTime() + 5.5 * 60 * 60 * 1000)
          const alertHourIST = alertIST.getUTCHours()
          const alertMinuteIST = alertIST.getUTCMinutes()
          
          // Strategy 1: Alert UTC hour matches anomaly IST hour (alert stored as IST without timezone)
          // Example: Alert 12:11 UTC should match anomaly 12:00 IST
          const hourDiffUTC = Math.abs(alertHourUTC - anomalyHourIST)
          const minuteDiffUTC = Math.abs(alertMinuteUTC - anomalyMinuteIST)
          const matchesAsIST = (hourDiffUTC === 0 && minuteDiffUTC <= 30) || (hourDiffUTC === 1 && alertMinuteUTC <= 30 && anomalyMinuteIST >= 30)
          
          // Strategy 2: Alert IST hour matches anomaly IST hour (normal case)
          const hourDiffIST = Math.abs(alertHourIST - anomalyHourIST)
          const minuteDiffIST = Math.abs(alertMinuteIST - anomalyMinuteIST)
          const timeDiffMinutesIST = hourDiffIST * 60 + minuteDiffIST
          const matchesInIST = timeDiffMinutesIST <= 30 || (1440 - timeDiffMinutesIST) <= 30
          
          const matches = matchesAsIST || matchesInIST
          
          if (matches) {
            console.log('Alert matches:', {
              alertUTC: alertUTC.toISOString(),
              alertHourUTC: alertHourUTC + ':' + String(alertMinuteUTC).padStart(2, '0'),
              alertHourIST: alertHourIST + ':' + String(alertMinuteIST).padStart(2, '0'),
              matchesAsIST,
              matchesInIST
            })
          }
          
          return matches
        })
        
        console.log('After IST filtering, found', filteredAlerts.length, 'matching alerts')
        if (filteredAlerts.length > 0) {
          return filteredAlerts
        }
      }
    }
    
    return alerts
  },

  /**
   * Fetch alerts near a specific timestamp (for anomaly correlation)
   * Searches within a time window around the anomaly time
   */
  async fetchAlertsNearTime(
    anomalyTime: Date, // IST
    windowMinutes: number = 30 // Search ±30 minutes by default
  ) {
    const start = new Date(anomalyTime.getTime() - windowMinutes * 60 * 1000)
    const end = new Date(anomalyTime.getTime() + windowMinutes * 60 * 1000)
    
    return this.fetchAlerts({ start, end })
  },

  /**
   * Fetch alert metric mappings for domain-based correlation
   */
  async fetchAlertMetricMap(domain?: string) {
    const params: QueryParams = {
      select: '*',
      eq: { is_active: 'true' }
    }

    if (domain) {
      params.eq = { ...params.eq, domain }
    }

    return fetchFromSupabase('bharatpe_alerts_metric_map', params)
  }
}

