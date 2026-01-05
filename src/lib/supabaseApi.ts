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
   * Fetch hourly metrics for a specific date and cohorts
   */
  async fetchHourlyMetrics(
    date: string,
    cohorts: string[] = ['DAY-0', 'DAY-1', 'DAY-7']
  ) {
    return fetchFromSupabase('bharatpe_app_hourly_metrics', {
      select: '*',
      eq: { dt: date },
      in: { cohort: cohorts }
    })
  },

  /**
   * Fetch latest date for a specific cohort
   */
  async fetchLatestDate(cohort: string = 'DAY-0') {
    const results = await fetchFromSupabase('bharatpe_app_hourly_metrics', {
      select: 'dt',
      eq: { cohort },
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
   */
  async fetchAlerts(
    timeWindow?: { start: Date; end: Date }
  ) {
    const params: QueryParams = {
      select: '*',
      order: { column: 'triggered_at', ascending: false }
    }

    if (timeWindow?.start && timeWindow?.end) {
      // Convert IST dates to UTC for query
      const startUTC = new Date(timeWindow.start.getTime() - (5.5 * 60 * 60 * 1000))
      const endUTC = new Date(timeWindow.end.getTime() - (5.5 * 60 * 60 * 1000))
      
      params.gte = { triggered_at: startUTC.toISOString() }
      params.lte = { triggered_at: endUTC.toISOString() }
    }

    return fetchFromSupabase('bharatpe_alerts_events', params)
  }
}

