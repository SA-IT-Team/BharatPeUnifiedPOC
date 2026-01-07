import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { HourlyAllMetricsData } from '../../lib/types'

interface HourlyAllMetricsChartProps {
  data: HourlyAllMetricsData[]
  selectedMetrics: string[]
  onAnomalyClick?: (hour: number) => void
}

const metricColors: Record<string, string> = {
  applications_created: '#09B6DE',
  applications_submitted: '#FA6C61',
  applications_pending: '#F59E0B',
  applications_approved: '#10B981',
  applications_nached: '#8B5CF6',
  autopay_done_applications: '#EC4899'
}

const metricLabels: Record<string, string> = {
  applications_created: 'Created',
  applications_submitted: 'Submitted',
  applications_pending: 'Pending',
  applications_approved: 'Approved',
  applications_nached: 'NACHed',
  autopay_done_applications: 'Autopay Done'
}

export function HourlyAllMetricsChart({ 
  data, 
  selectedMetrics,
  onAnomalyClick 
}: HourlyAllMetricsChartProps) {
  const chartData = data.map(item => {
    const chartItem: any = {
      hour: item.hour,
      hourDisplay: `${item.hour}:00`,
      isAnomaly: item.isAnomaly
    }
    
    selectedMetrics.forEach(metric => {
      chartItem[metric] = item[metric as keyof HourlyAllMetricsData] as number
    })
    
    return chartItem
  })

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props
    if (payload.isAnomaly) {
      return (
        <g>
          <circle cx={cx} cy={cy} r={8} fill="#FA6C61" stroke="#DC2626" strokeWidth={2} />
          <circle cx={cx} cy={cy} r={4} fill="#FFFFFF" />
        </g>
      )
    }
    return <circle cx={cx} cy={cy} r={4} fill={props.fill} />
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = chartData.find(d => d.hour === label)
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-semibold mb-2">Hour {label}:00</p>
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
          if (e && e.activePayload && e.activePayload[0]) {
            const hour = e.activePayload[0].payload.hour
            if (e.activePayload[0].payload.isAnomaly && onAnomalyClick) {
              onAnomalyClick(hour)
            }
          }
        }}
        style={{ cursor: 'pointer' }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="hour" 
          label={{ value: 'Hour', position: 'insideBottom', offset: -5 }}
        />
        <YAxis label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
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
            name={metricLabels[metric] || metric}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

