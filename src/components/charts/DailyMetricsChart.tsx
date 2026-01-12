import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { DailyMetricData } from '../../lib/types'
import { forecastNext7Days } from '../../lib/forecast'

interface DailyMetricsChartProps {
  data: DailyMetricData[]
  selectedMetrics: string[]
  showForecast?: boolean
  onAnomalyClick?: (date: string) => void
  onAnomalyIconClick?: (date: string, event: React.MouseEvent) => void
}

const metricColors: Record<string, string> = {
  eligible: '#3B82F6',
  started: '#8B5CF6',
  kyc_initiated: '#F59E0B',
  kyc_completed: '#10B981',
  nach_initiated: '#EC4899',
  nach_done: '#8B5CF6',
  processed: '#06B6D4',
  approved: '#007C77',
  submitted: '#FA6C61',
  disbursed: '#09B6DE'
}

export function DailyMetricsChart({ 
  data, 
  selectedMetrics,
  showForecast = true,
  onAnomalyClick,
  onAnomalyIconClick
}: DailyMetricsChartProps) {
  // Prepare historical data
  const historicalChartData = data.map(item => {
    const chartItem: any = {
      date: new Date(item.dt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      dateKey: item.dt,
      isAnomaly: item.isAnomaly,
      deltaDisbursed: item.deltaDisbursed
    }
    
    selectedMetrics.forEach(metric => {
      chartItem[metric] = item[metric as keyof DailyMetricData] as number
    })
    
    return chartItem
  })

  // Generate forecast for each selected metric
  let forecastData: any[] = []
  if (showForecast && selectedMetrics.length > 0 && data.length > 0) {
    const forecastDates: string[] = []
    for (let i = 1; i <= 7; i++) {
      const date = new Date('2025-12-23')
      date.setDate(date.getDate() + i)
      forecastDates.push(date.toISOString().split('T')[0])
    }
    
    // Generate forecast for each metric
    const forecastsByMetric: Record<string, Array<{ date: string; value: number; isForecast: boolean }>> = {}
    selectedMetrics.forEach(metric => {
      forecastsByMetric[metric] = forecastNext7Days(data, metric as keyof DailyMetricData)
    })
    
    forecastData = forecastDates.map(date => {
      const forecastItem: any = {
        date: new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        dateKey: date,
        isForecast: true,
        isAnomaly: false
      }
      
      selectedMetrics.forEach(metric => {
        const forecastForDate = forecastsByMetric[metric].find(f => f.date === date)
        forecastItem[metric] = forecastForDate?.value || 0
      })
      
      return forecastItem
    })
  }

  const chartData = [...historicalChartData, ...forecastData]

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props
    if (payload.isAnomaly) {
      return (
        <g>
          <circle cx={cx} cy={cy} r={8} fill="#FA6C61" stroke="#DC2626" strokeWidth={2} />
          <circle cx={cx} cy={cy} r={4} fill="#FFFFFF" />
          {onAnomalyIconClick && (
            <g
              onClick={(e) => {
                e.stopPropagation()
                onAnomalyIconClick(payload.dateKey, e as any)
              }}
              style={{ cursor: 'pointer' }}
            >
              <circle cx={cx} cy={cy - 20} r={10} fill="#FF6B6B" stroke="#DC2626" strokeWidth={2} opacity={0.9} />
              <text
                x={cx}
                y={cy - 20}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize="10"
                fontWeight="bold"
              >
                ⚠
              </text>
            </g>
          )}
        </g>
      )
    }
    if (payload.isForecast) {
      return (
        <g>
          <circle cx={cx} cy={cy} r={6} fill={props.fill} stroke={props.stroke} strokeWidth={2} strokeDasharray="3 3" />
        </g>
      )
    }
    return <circle cx={cx} cy={cy} r={4} fill={props.fill} />
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = chartData.find(d => d.date === label)
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-semibold mb-2">{label} {dataPoint?.isForecast && '(Forecast)'}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value?.toLocaleString()}
            </p>
          ))}
          {dataPoint?.isAnomaly && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="text-xs font-semibold text-red-600">⚠️ Anomaly Detected</p>
            </div>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={450}>
      <LineChart 
        data={chartData} 
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        onClick={(e: any) => {
          if (e && e.activePayload && e.activePayload[0] && !e.activePayload[0].payload.isForecast) {
            const dateKey = e.activePayload[0].payload.dateKey
            if (e.activePayload[0].payload.isAnomaly && onAnomalyClick) {
              onAnomalyClick(dateKey)
            }
          }
        }}
        style={{ cursor: 'pointer' }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis label={{ value: 'Amount', angle: -90, position: 'insideLeft' }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        {selectedMetrics.map(metric => (
          <Line
            key={metric}
            type="monotone"
            dataKey={metric}
            stroke={metricColors[metric] || '#666'}
            strokeWidth={2}
            dot={<CustomDot />}
            strokeDasharray={chartData.some(d => d.isForecast) ? undefined : undefined}
            name={metric.charAt(0).toUpperCase() + metric.slice(1).replace(/_/g, ' ')}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

