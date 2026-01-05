import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { HourlyMetricData } from '../../lib/types'

interface HourlyFunnelChartProps {
  data: HourlyMetricData[]
}

export function HourlyFunnelChart({ data }: HourlyFunnelChartProps) {
  const chartData = data.map(item => ({
    hour: item.hour,
    'DAY-0': item.day0,
    'DAY-1': item.day1,
    'DAY-7': item.day7
  }))

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="hour" 
          label={{ value: 'Hour', position: 'insideBottom', offset: -5 }}
        />
        <YAxis label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="DAY-0" 
          stroke="#09B6DE" 
          strokeWidth={2}
          dot={{ r: 4 }}
        />
        <Line 
          type="monotone" 
          dataKey="DAY-1" 
          stroke="#007C77" 
          strokeWidth={2}
          dot={{ r: 4 }}
        />
        <Line 
          type="monotone" 
          dataKey="DAY-7" 
          stroke="#FA6C61" 
          strokeWidth={2}
          dot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

