/**
 * Data validation utilities for production-ready error handling
 */

export function validateDate(dateString: string): { valid: boolean; error?: string } {
  if (!dateString || dateString.trim() === '') {
    return { valid: false, error: 'Date is required' }
  }

  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Invalid date format' }
  }

  // Check if date is too far in the future (more than 1 day)
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  if (date > today) {
    return { valid: false, error: 'Date cannot be in the future' }
  }

  // Check if date is too old (more than 1 year ago)
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  if (date < oneYearAgo) {
    return { valid: false, error: 'Date is too old (more than 1 year ago)' }
  }

  return { valid: true }
}

export function validateHour(hour: string | number): { valid: boolean; error?: string } {
  const hourNum = typeof hour === 'string' ? parseInt(hour, 10) : hour
  
  if (isNaN(hourNum) || hourNum < 0 || hourNum > 23) {
    return { valid: false, error: 'Hour must be between 0 and 23' }
  }

  return { valid: true }
}

export function validateTimeWindow(
  windowBefore: number,
  windowAfter: number
): { valid: boolean; error?: string } {
  if (windowBefore < 0 || windowAfter < 0) {
    return { valid: false, error: 'Time window values must be non-negative' }
  }

  if (windowBefore > 1440) { // 24 hours
    return { valid: false, error: 'Time window before cannot exceed 24 hours' }
  }

  if (windowAfter > 1440) {
    return { valid: false, error: 'Time window after cannot exceed 24 hours' }
  }

  return { valid: true }
}

export function sanitizeSearchText(text: string): string {
  if (!text) return ''
  // Remove potentially dangerous characters, limit length
  return text.trim().slice(0, 200).replace(/[<>]/g, '')
}

export function validateMetricField(
  field: string,
  type: 'hourly' | 'daily'
): { valid: boolean; error?: string } {
  const hourlyFields = [
    'applications_created',
    'applications_submitted',
    'applications_approved',
    'applications_pending',
    'applications_nached',
    'autopay_done_applications'
  ]

  const dailyFields = [
    'disbursed',
    'approved',
    'submitted',
    'eligible',
    'started',
    'kyc_initiated',
    'kyc_completed',
    'nach_initiated',
    'nach_done',
    'processed'
  ]

  const validFields = type === 'hourly' ? hourlyFields : dailyFields

  if (!validFields.includes(field)) {
    return {
      valid: false,
      error: `Invalid metric field. Must be one of: ${validFields.join(', ')}`
    }
  }

  return { valid: true }
}




