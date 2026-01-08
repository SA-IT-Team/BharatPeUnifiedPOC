import { DailyMetricData } from './types'

/**
 * Simple linear regression forecasting for next 7 days
 * Uses moving average with trend adjustment
 */
export function forecastNext7Days(
  historicalData: DailyMetricData[],
  metricField: keyof DailyMetricData
): Array<{ date: string; value: number; isForecast: boolean }> {
  if (historicalData.length < 7) {
    // Not enough data, use simple average
    const avg = historicalData.reduce((sum, d) => sum + (d[metricField] as number), 0) / historicalData.length
    const forecast: Array<{ date: string; value: number; isForecast: boolean }> = []
    
    for (let i = 1; i <= 7; i++) {
      const date = new Date('2025-12-23')
      date.setDate(date.getDate() + i)
      forecast.push({
        date: date.toISOString().split('T')[0],
        value: avg,
        isForecast: true
      })
    }
    return forecast
  }

  // Use last 7 days for trend calculation
  const recentData = historicalData.slice(-7)
  const values = recentData.map(d => d[metricField] as number)
  
  // Calculate trend (slope)
  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumX2 = 0
  
  for (let i = 0; i < values.length; i++) {
    sumX += i
    sumY += values[i]
    sumXY += i * values[i]
    sumX2 += i * i
  }
  
  const n = values.length
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  
  // Calculate average growth rate
  const growthRates: number[] = []
  for (let i = 1; i < values.length; i++) {
    if (values[i - 1] !== 0) {
      growthRates.push((values[i] - values[i - 1]) / values[i - 1])
    }
  }
  const avgGrowthRate = growthRates.length > 0
    ? growthRates.reduce((a, b) => a + b, 0) / growthRates.length
    : 0
  
  // Forecast next 7 days
  const lastValue = values[values.length - 1]
  const forecast: Array<{ date: string; value: number; isForecast: boolean }> = []
  
  for (let i = 1; i <= 7; i++) {
    const date = new Date('2025-12-23')
    date.setDate(date.getDate() + i)
    
    // Use trend + growth rate adjustment
    const trendValue = intercept + slope * (n + i - 1)
    const growthValue = lastValue * (1 + avgGrowthRate * i)
    
    // Weighted average: 60% trend, 40% growth
    const forecastValue = Math.max(0, trendValue * 0.6 + growthValue * 0.4)
    
    forecast.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(forecastValue),
      isForecast: true
    })
  }
  
  return forecast
}



