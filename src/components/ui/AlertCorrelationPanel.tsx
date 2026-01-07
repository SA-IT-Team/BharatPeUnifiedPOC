import { CorrelatedAlert } from '../../lib/types'
import { formatIST, toIST } from '../../lib/utils'
import { AlertCircle, Info, Clock, Tag } from 'lucide-react'

interface AlertCorrelationPanelProps {
  alerts: CorrelatedAlert[]
  anomalyType: 'hourly' | 'daily'
  anomalyTime: string
  metric: string
  delta?: number | null
}

export function AlertCorrelationPanel({
  alerts,
  anomalyType,
  anomalyTime,
  metric,
  delta
}: AlertCorrelationPanelProps) {
  if (alerts.length === 0) {
    return (
      <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center gap-2">
          <Info className="text-gray-400" size={16} />
          <p className="text-sm text-gray-600">No alerts found near this anomaly time.</p>
        </div>
      </div>
    )
  }

  const alertsWithMappings = alerts.filter(a => a.alertMappings && a.alertMappings.length > 0)
  const alertsWithoutMappings = alerts.filter(a => !a.alertMappings || a.alertMappings.length === 0)

  return (
    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex items-start gap-2 mb-4">
        <AlertCircle className="text-yellow-600 mt-0.5" size={20} />
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Alerts Detected Near Anomaly
          </h3>
          <p className="text-xs text-gray-600 mt-1">
            {anomalyType === 'hourly' ? 'Hour' : 'Date'}: {anomalyTime} | Metric: {metric}
            {delta !== null && delta !== undefined && (
              <span className="ml-2">| Change: {delta.toFixed(2)}%</span>
            )}
          </p>
        </div>
      </div>

      {alertsWithMappings.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
            <Tag size={14} />
            Alerts with Metric Mapping ({alertsWithMappings.length}):
          </div>
          <div className="space-y-3">
            {alertsWithMappings.map((alert, idx) => (
              <div key={idx} className="bg-white p-3 rounded border border-gray-200 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900 mb-1">
                      {alert.alert_name}
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className={`px-2 py-0.5 rounded ${
                        alert.source === 'coralogix' ? 'bg-bharatpe-blue-light text-bharatpe-blue-dark' :
                        alert.source === 'cloudflare' ? 'bg-orange-100 text-orange-800' :
                        alert.source === 'sentry' ? 'bg-bharatpe-red-light text-bharatpe-red' :
                        alert.source === 'slack' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {alert.source}
                      </span>
                      {alert.priority && (
                        <span className={`px-2 py-0.5 rounded ${
                          alert.priority === 'p1' ? 'bg-red-100 text-red-800' :
                          alert.priority === 'p2' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {alert.priority.toUpperCase()}
                        </span>
                      )}
                      {alert.severity && (
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-800">
                          Severity: {alert.severity}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock size={12} />
                    {formatIST(toIST(alert.triggered_at))}
                  </div>
                </div>
                
                {alert.message && (
                  <div className="text-xs text-gray-700 mb-2 bg-gray-50 p-2 rounded">
                    {alert.message}
                  </div>
                )}

                {alert.alertMappings && alert.alertMappings.map((mapping, mapIdx) => (
                  <div key={mapIdx} className="mt-2 pt-2 border-t border-gray-200">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-gray-600 font-medium">Domain:</span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                        {mapping.domain}
                      </span>
                      <span className="text-gray-600 font-medium ml-2">Metric:</span>
                      <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded">
                        {mapping.metric}
                      </span>
                      {mapping.confidence && (
                        <>
                          <span className="text-gray-600 font-medium ml-2">Confidence:</span>
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded">
                            {(parseFloat(mapping.confidence) * 100).toFixed(0)}%
                          </span>
                        </>
                      )}
                    </div>
                    {mapping.notes && (
                      <div className="mt-2 text-xs text-gray-600 italic bg-blue-50 p-2 rounded">
                        <span className="font-medium">Notes:</span> {mapping.notes}
                      </div>
                    )}
                  </div>
                ))}

                {alert.host && (
                  <div className="mt-2 text-xs text-gray-600">
                    <span className="font-medium">Host:</span> {alert.host}
                    {alert.path && <span className="ml-2"><span className="font-medium">Path:</span> {alert.path}</span>}
                    {alert.status_code && <span className="ml-2"><span className="font-medium">Status:</span> {alert.status_code}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {alertsWithoutMappings.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
            <Info size={14} />
            Other Alerts Nearby ({alertsWithoutMappings.length}):
          </div>
          <div className="space-y-2">
            {alertsWithoutMappings.slice(0, 5).map((alert, idx) => (
              <div key={idx} className="bg-white p-2 rounded border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-xs font-medium text-gray-900">
                      {alert.alert_name}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1 text-xs">
                      <span className={`px-1.5 py-0.5 rounded ${
                        alert.source === 'coralogix' ? 'bg-bharatpe-blue-light text-bharatpe-blue-dark' :
                        alert.source === 'cloudflare' ? 'bg-orange-100 text-orange-800' :
                        alert.source === 'sentry' ? 'bg-bharatpe-red-light text-bharatpe-red' :
                        alert.source === 'slack' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {alert.source}
                      </span>
                      {alert.priority && (
                        <span className={`px-1.5 py-0.5 rounded ${
                          alert.priority === 'p1' ? 'bg-red-100 text-red-800' :
                          alert.priority === 'p2' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {alert.priority.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock size={10} />
                    {formatIST(toIST(alert.triggered_at))}
                  </div>
                </div>
                {alert.message && (
                  <div className="text-xs text-gray-600 mt-1 truncate">
                    {alert.message.substring(0, 100)}...
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs text-gray-600 pt-2 border-t border-yellow-200">
        Total alerts detected near anomaly time: {alerts.length}
      </div>
    </div>
  )
}

