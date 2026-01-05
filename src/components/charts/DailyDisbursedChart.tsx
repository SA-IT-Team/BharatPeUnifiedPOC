import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { DailyMetricData } from '../../lib/types'

interface DailyDisbursedChartProps {
  data: DailyMetricData[]
  showApproved?: boolean
  showSubmitted?: boolean
}

export function DailyDisbursedChart({ 
  data, 
  showApproved = false, 
  showSubmitted = false 
}: DailyDisbursedChartProps) {
  const chartData = data.map(item => ({
    date: new Date(item.dt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    disbursed: item.disbursed,
    approved: showApproved ? item.approved : undefined,
    submitted: showSubmitted ? item.submitted : undefined
  }))

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis label={{ value: 'Amount', angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="disbursed" 
          stroke="#09B6DE" 
          strokeWidth={2}
          dot={{ r: 4 }}
        />
        {showApproved && (
          <Line 
            type="monotone" 
            dataKey="approved" 
            stroke="#007C77" 
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        )}
        {showSubmitted && (
          <Line 
            type="monotone" 
            dataKey="submitted" 
            stroke="#FA6C61" 
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}

