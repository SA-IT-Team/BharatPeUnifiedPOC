// Supabase table types
export interface AppHourlyMetric {
  dt: string // date
  hour: string // "0".."23"
  cohort: string | null // nullable, may not always be used
  applications_created: string | null
  applications_submitted: string | null
  applications_pending: string | null
  applications_nached: string | null
  autopay_done_applications: string | null
  applications_approved: string | null
}

export interface DayByDayAmountMetric {
  dt: string // date
  eligible: string | null
  started: string | null
  shop_details_page: string | null
  shop_photo: string | null
  kyc_initiated: string | null
  kyc_completed: string | null
  add_detials_submitted: string | null
  ref_page_submitted: string | null
  submitted: string | null
  nach_initiated: string | null
  nach_done: string | null
  processed: string | null
  approved: string | null
  disbursed: string | null
}

export interface BharatPeAlertEvent {
  triggered_at: string // timestamptz
  source: 'coralogix' | 'cloudflare' | 'sentry' | 'slack' | string
  priority: 'p1' | 'p2' | string
  severity: string | null
  team: string | null
  application: string | null
  subsystem: string | null
  alert_name: string | null
  message: string | null
  alert_query: string | null
  sample_log: string | null
  host: string | null
  path: string | null
  status_code: string | null
  threshold: string | null
  value: string | null
  ingested_at: string | null
}

// Computed types
export interface HourlyMetricData {
  hour: number
  day0: number
  day1: number
  day7: number
  deltaDay1: number | null // percentage
  deltaDay7: number | null // percentage
  isAnomaly: boolean
}

export interface HourlyAllMetricsData {
  hour: number
  applications_created: number
  applications_submitted: number
  applications_pending: number
  applications_approved: number
  applications_nached: number
  autopay_done_applications: number
  isAnomaly: boolean
}

export interface HourlyAnomaly {
  hour: number
  metric: string
  day0Value: number
  day1Value: number
  day7Value: number
  deltaDay1: number | null
  deltaDay7: number | null
  timestamp: Date // IST datetime
}

export interface DailyMetricData {
  dt: string
  // Collection funnel metrics
  eligible: number
  started: number
  shop_details_page: number
  shop_photo: number
  kyc_initiated: number
  kyc_completed: number
  add_detials_submitted: number
  ref_page_submitted: number
  submitted: number
  nach_initiated: number
  nach_done: number
  processed: number
  approved: number
  disbursed: number
  // Comparison data
  prevDisbursed: number | null
  deltaDisbursed: number | null // percentage
  isAnomaly: boolean
}

export interface DailyAnomaly {
  dt: string
  metric: string
  currentValue: number
  prevValue: number
  delta: number | null
}

export interface CorrelatedAlert extends BharatPeAlertEvent {
  correlationScore?: number
  alertMappings?: AlertMetricMap[]
}

export type HourlyMetricField = 
  | 'applications_created'
  | 'applications_submitted'
  | 'applications_approved'
  | 'applications_pending'
  | 'applications_nached'
  | 'autopay_done_applications'

export type DailyMetricField = 
  | 'disbursed' 
  | 'approved' 
  | 'submitted'
  | 'eligible'
  | 'started'
  | 'kyc_initiated'
  | 'kyc_completed'
  | 'nach_initiated'
  | 'nach_done'
  | 'processed'

// Alert Metric Map types
export interface AlertMetricMap {
  id: string
  match_field: string // e.g., 'alert_name', 'subsystem', 'path'
  match_type: string // e.g., 'contains', 'equals', 'regex'
  match_value: string
  domain: string // 'applications' | 'collections'
  metric: string // e.g., 'applications_created', 'disbursed'
  confidence: string | null
  notes: string | null
  is_active: string // 'true' | 'false'
  created_at: string
}

