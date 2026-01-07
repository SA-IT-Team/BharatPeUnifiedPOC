import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { DailyMetricData } from '../../lib/types'

interface DailyDisbursedChartProps {
  data: DailyMetricData[]
  showApproved?: boolean
  showSubmitted?: boolean
  showKycInitiated?: boolean
  showKycCompleted?: boolean
  showNachDone?: boolean
  showProcessed?: boolean
  onAnomalyClick?: (date: string) => void
}

export function DailyDisbursedChart({ 
  data, 
  showApproved = false, 
  showSubmitted = false,
  showKycInitiated = false,
  showKycCompleted = false,
  showNachDone = false,
  showProcessed = false,
  onAnomalyClick
}: DailyDisbursedChartProps) {
  const chartData = data.map(item => ({
    date: new Date(item.dt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    dateKey: item.dt,
    disbursed: item.disbursed,
    approved: showApproved ? item.approved : undefined,
    submitted: showSubmitted ? item.submitted : undefined,
    kyc_initiated: showKycInitiated ? item.kyc_initiated : undefined,
    kyc_completed: showKycCompleted ? item.kyc_completed : undefined,
    nach_done: showNachDone ? item.nach_done : undefined,
    processed: showProcessed ? item.processed : undefined,
    isAnomaly: item.isAnomaly,
    deltaDisbursed: item.deltaDisbursed
  }))

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
      const dataPoint = chartData.find(d => d.date === label)
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value?.toLocaleString()}
            </p>
          ))}
          {dataPoint?.isAnomaly && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="text-xs font-semibold text-red-600">⚠️ Anomaly Detected</p>
              {dataPoint.deltaDisbursed !== null && (
                <p className="text-xs text-gray-600">Change: {dataPoint.deltaDisbursed.toFixed(2)}%</p>
              )}
            </div>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart 
        data={chartData} 
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        onClick={(e: any) => {
          if (e && e.activePayload && e.activePayload[0]) {
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
        <Line 
          type="monotone" 
          dataKey="disbursed" 
          stroke="#09B6DE" 
          strokeWidth={2}
          dot={<CustomDot />}
          name="Disbursed"
        />
        {showApproved && (
          <Line 
            type="monotone" 
            dataKey="approved" 
            stroke="#007C77" 
            strokeWidth={2}
            dot={{ r: 4 }}
            name="Approved"
          />
        )}
        {showSubmitted && (
          <Line 
            type="monotone" 
            dataKey="submitted" 
            stroke="#FA6C61" 
            strokeWidth={2}
            dot={{ r: 4 }}
            name="Submitted"
          />
        )}
        {showKycInitiated && (
          <Line 
            type="monotone" 
            dataKey="kyc_initiated" 
            stroke="#F59E0B" 
            strokeWidth={2}
            dot={{ r: 4 }}
            name="KYC Initiated"
          />
        )}
        {showKycCompleted && (
          <Line 
            type="monotone" 
            dataKey="kyc_completed" 
            stroke="#10B981" 
            strokeWidth={2}
            dot={{ r: 4 }}
            name="KYC Completed"
          />
        )}
        {showNachDone && (
          <Line 
            type="monotone" 
            dataKey="nach_done" 
            stroke="#8B5CF6" 
            strokeWidth={2}
            dot={{ r: 4 }}
            name="NACH Done"
          />
        )}
        {showProcessed && (
          <Line 
            type="monotone" 
            dataKey="processed" 
            stroke="#EC4899" 
            strokeWidth={2}
            dot={{ r: 4 }}
            name="Processed"
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}

