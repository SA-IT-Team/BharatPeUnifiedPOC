import { CorrelatedAlert } from '../../lib/types'
import { formatPercent } from '../../lib/utils'
import { Button } from '../ui/Button'

interface IncidentCardProps {
  metric: string
  timeframe: string
  currentValue: number
  baselines: {
    day1?: number
    day7?: number
    yesterday?: number
  }
  delta: number | null
  correlatedAlerts: CorrelatedAlert[]
  onGenerateSummary: () => void
}

export function IncidentCard({
  metric,
  timeframe,
  currentValue,
  baselines,
  delta,
  correlatedAlerts,
  onGenerateSummary
}: IncidentCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Incident Details</h2>
        <div className="text-sm text-gray-600">
          <span className="font-semibold">Metric:</span> {metric} | <span className="font-semibold">Timeframe:</span> {timeframe}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded">
          <div className="text-sm text-gray-600 mb-1">Current Value</div>
          <div className="text-2xl font-bold text-gray-900">{currentValue.toLocaleString()}</div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded">
          <div className="text-sm text-gray-600 mb-1">% Change</div>
          <div className={`text-2xl font-bold ${
            delta !== null && delta < 0 ? 'text-bharatpe-red' : 'text-gray-900'
          }`}>
            {formatPercent(delta)}
          </div>
        </div>

        {baselines.day1 !== undefined && (
          <div className="bg-gray-50 p-4 rounded">
            <div className="text-sm text-gray-600 mb-1">DAY-1 Baseline</div>
            <div className="text-xl font-semibold text-gray-900">{baselines.day1.toLocaleString()}</div>
          </div>
        )}

        {baselines.day7 !== undefined && (
          <div className="bg-gray-50 p-4 rounded">
            <div className="text-sm text-gray-600 mb-1">DAY-7 Baseline</div>
            <div className="text-xl font-semibold text-gray-900">{baselines.day7.toLocaleString()}</div>
          </div>
        )}

        {baselines.yesterday !== undefined && (
          <div className="bg-gray-50 p-4 rounded">
            <div className="text-sm text-gray-600 mb-1">Yesterday</div>
            <div className="text-xl font-semibold text-gray-900">{baselines.yesterday.toLocaleString()}</div>
          </div>
        )}
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Top Correlated Alerts ({correlatedAlerts.length})
          </h3>
          <Button onClick={onGenerateSummary}>
            Generate Summary
          </Button>
        </div>
        
        {correlatedAlerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No correlated alerts found
          </div>
        ) : (
          <div className="space-y-2">
            {correlatedAlerts.slice(0, 10).map((alert, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded p-3 hover:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        alert.priority === 'p1' 
                          ? 'bg-bharatpe-red-light text-bharatpe-red' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {alert.priority}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {alert.alert_name || 'Unnamed Alert'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {alert.source}
                      </span>
                    </div>
                    {alert.message && (
                      <div className="text-sm text-gray-600 line-clamp-2">
                        {alert.message}
                      </div>
                    )}
                  </div>
                  {alert.value && (
                    <div className="text-sm font-semibold text-gray-700 ml-4">
                      {alert.value}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

