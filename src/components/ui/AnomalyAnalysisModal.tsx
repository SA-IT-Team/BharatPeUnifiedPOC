import { useState, useEffect } from 'react'
import { X, AlertTriangle, Clock, Target, TrendingDown, Users, Lightbulb, Loader2 } from 'lucide-react'
import { CorrelatedAlert } from '../../lib/types'
import { formatIST, toIST } from '../../lib/utils'
import { analyzeAnomaly, AnomalyAnalysis } from '../../lib/azureOpenAI'
import { supabaseApi } from '../../lib/supabaseApi'

interface AnomalyAnalysisModalProps {
  isOpen: boolean
  onClose: () => void
  anomalyType: 'hourly' | 'daily'
  anomalyTime: string
  metric: string
  metricValue: number
  previousValue?: number
  delta?: number | null
  anomalyTimestamp: Date
}

export function AnomalyAnalysisModal({
  isOpen,
  onClose,
  anomalyType,
  anomalyTime,
  metric,
  metricValue,
  previousValue,
  delta,
  anomalyTimestamp
}: AnomalyAnalysisModalProps) {
  const [alerts, setAlerts] = useState<CorrelatedAlert[]>([])
  const [analysis, setAnalysis] = useState<AnomalyAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        // Fetch alerts - for daily anomalies, use full day; for hourly, use ±30 minutes
        let start: Date
        let end: Date
        
        if (anomalyType === 'daily') {
          // For daily anomalies, search the entire day (00:00:00 to 23:59:59 IST)
          const year = anomalyTimestamp.getFullYear()
          const month = String(anomalyTimestamp.getMonth() + 1).padStart(2, '0')
          const day = String(anomalyTimestamp.getDate()).padStart(2, '0')
          const dateStr = `${year}-${month}-${day}`
          
          start = new Date(dateStr + 'T00:00:00+05:30')
          end = new Date(dateStr + 'T23:59:59+05:30')
        } else {
          // For hourly anomalies, use ±30 minutes window
          // anomalyTimestamp is already in IST (created with +05:30)
          start = new Date(anomalyTimestamp.getTime() - 30 * 60 * 1000)
          end = new Date(anomalyTimestamp.getTime() + 30 * 60 * 1000)
          
          console.log('Hourly anomaly at:', anomalyTimestamp.toISOString(), '(UTC)')
          console.log('Searching window:', start.toISOString(), 'to', end.toISOString(), '(UTC)')
          console.log('Which is IST:', start.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), 'to', end.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }))
        }
        
        const fetchedAlerts = await supabaseApi.fetchAlerts({ start, end })
        
        console.log('Fetched alerts count:', fetchedAlerts.length)
        if (fetchedAlerts.length > 0) {
          console.log('Sample alert times:', fetchedAlerts.slice(0, 3).map((a: any) => ({
            stored: a.triggered_at,
            asIST: new Date(a.triggered_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
          })))
        }

        // Fetch alert metric mappings
        const domain = anomalyType === 'hourly' ? 'applications' : 'collections'
        const mappings = await supabaseApi.fetchAlertMetricMap(domain)

        // Enhance alerts with mappings
        const enhancedAlerts: CorrelatedAlert[] = (fetchedAlerts as any[]).map(alert => {
          const matchedMappings = mappings.filter((map: any) => {
            if (map.is_active !== 'true') return false
            const matchField = map.match_field
            const matchType = map.match_type
            const matchValue = map.match_value.toLowerCase()
            const alertValue = (alert[matchField as keyof typeof alert] as string || '').toLowerCase()

            switch (matchType) {
              case 'contains':
                return alertValue.includes(matchValue)
              case 'equals':
                return alertValue === matchValue
              case 'regex':
                try {
                  return new RegExp(matchValue).test(alertValue)
                } catch {
                  return false
                }
              default:
                return false
            }
          })

          return {
            ...alert,
            alertMappings: matchedMappings.length > 0 ? matchedMappings : undefined
          }
        })

        setAlerts(enhancedAlerts)

        // Generate AI analysis
        setAnalyzing(true)
        const aiAnalysis = await analyzeAnomaly({
          anomalyType,
          anomalyTime,
          metric,
          metricValue,
          previousValue,
          delta,
          alerts: enhancedAlerts.map(alert => ({
            source: alert.source,
            priority: alert.priority || '',
            severity: alert.severity || '',
            alert_name: alert.alert_name,
            message: alert.message || '',
            triggered_at: formatIST(toIST(alert.triggered_at)),
            host: alert.host || undefined,
            path: alert.path || undefined,
            status_code: alert.status_code || undefined,
            mappings: alert.alertMappings?.map(m => ({
              domain: m.domain,
              metric: m.metric,
              confidence: m.confidence || '0.7',
              notes: m.notes || ''
            }))
          }))
        })

        setAnalysis(aiAnalysis)
      } catch (err) {
        console.error('Error fetching anomaly analysis:', err)
        setError(err instanceof Error ? err.message : 'Failed to analyze anomaly')
      } finally {
        setLoading(false)
        setAnalyzing(false)
      }
    }

    fetchData()
  }, [isOpen, anomalyTimestamp, anomalyType, anomalyTime, metric, metricValue, previousValue, delta])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-600" size={24} />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Anomaly Analysis</h2>
              <p className="text-sm text-gray-600 mt-1">
                {anomalyType === 'hourly' ? 'Hour' : 'Date'}: {anomalyTime} | Metric: {metric}
                {delta !== null && delta !== undefined && (
                  <span className="ml-2 text-red-600 font-semibold">
                    ({delta >= 0 ? '+' : ''}{delta.toFixed(2)}%)
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-bharatpe-blue" size={32} />
              <span className="ml-3 text-gray-600">Loading alerts and generating analysis...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          ) : (
            <>
              {/* AI Analysis Section */}
              {analyzing ? (
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin text-blue-600" size={20} />
                    <span className="text-blue-800">AI is analyzing the anomaly...</span>
                  </div>
                </div>
              ) : analysis ? (
                <div className="mb-6 space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Target className="text-blue-600" size={20} />
                      AI-Powered Analysis
                      <span className="ml-auto text-sm font-normal text-gray-600">
                        Confidence: {(analysis.confidence * 100).toFixed(0)}%
                      </span>
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <TrendingDown size={16} />
                          Summary
                        </h4>
                        <p className="text-sm text-gray-700 bg-white p-3 rounded border border-gray-200">
                          {typeof analysis.summary === 'string' 
                            ? analysis.summary 
                            : String(analysis.summary || 'N/A')}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <AlertTriangle size={16} />
                          Root Cause
                        </h4>
                        <p className="text-sm text-gray-700 bg-white p-3 rounded border border-gray-200">
                          {typeof analysis.rootCause === 'string' 
                            ? analysis.rootCause 
                            : String(analysis.rootCause || 'N/A')}
                        </p>
                      </div>

                      {analysis.affectedSystems.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <Users size={16} />
                            Affected Systems
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {analysis.affectedSystems.map((system, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium"
                              >
                                {typeof system === 'string' ? system : String(system)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <Clock size={16} />
                          Timeline
                        </h4>
                        <p className="text-sm text-gray-700 bg-white p-3 rounded border border-gray-200">
                          {typeof analysis.timeline === 'string' 
                            ? analysis.timeline 
                            : typeof analysis.timeline === 'object' 
                              ? JSON.stringify(analysis.timeline, null, 2)
                              : String(analysis.timeline || 'N/A')}
                        </p>
                      </div>

                      {analysis.recommendations.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <Lightbulb size={16} />
                            Recommendations
                          </h4>
                          <ul className="space-y-2">
                            {analysis.recommendations.map((rec, idx) => (
                              <li
                                key={idx}
                                className="text-sm text-gray-700 bg-white p-3 rounded border border-gray-200 flex items-start gap-2"
                              >
                                <span className="text-blue-600 font-bold mt-0.5">{idx + 1}.</span>
                                <span>{typeof rec === 'string' ? rec : String(rec)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Alerts Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Correlated Alerts ({alerts.length})
                </h3>
                {anomalyType === 'hourly' && (
                  <p className="text-xs text-gray-600 mb-4">
                    Showing alerts within ±30 minutes of {anomalyTime} on {anomalyTimestamp.toLocaleDateString('en-IN')}
                  </p>
                )}
                {alerts.length === 0 ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-600">
                    No alerts found within ±30 minutes of this anomaly
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alerts.map((alert, idx) => (
                      <div
                        key={idx}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-gray-900 mb-1">
                              {alert.alert_name}
                            </h4>
                            <div className="flex flex-wrap gap-2 text-xs">
                              <span
                                className={`px-2 py-0.5 rounded ${
                                  alert.source === 'coralogix'
                                    ? 'bg-bharatpe-blue-light text-bharatpe-blue-dark'
                                    : alert.source === 'cloudflare'
                                    ? 'bg-orange-100 text-orange-800'
                                    : alert.source === 'sentry'
                                    ? 'bg-bharatpe-red-light text-bharatpe-red'
                                    : alert.source === 'slack'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {alert.source}
                              </span>
                              {alert.priority && (
                                <span
                                  className={`px-2 py-0.5 rounded ${
                                    alert.priority === 'p1'
                                      ? 'bg-red-100 text-red-800'
                                      : alert.priority === 'p2'
                                      ? 'bg-orange-100 text-orange-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
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
                          <div className="text-xs text-gray-500 flex items-center gap-1 ml-4">
                            <Clock size={12} />
                            {formatIST(toIST(alert.triggered_at))}
                          </div>
                        </div>

                        {alert.message && (
                          <p className="text-xs text-gray-700 mt-2 bg-gray-50 p-2 rounded">
                            {alert.message}
                          </p>
                        )}

                        {alert.alertMappings && alert.alertMappings.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="text-xs font-semibold text-gray-700 mb-2">
                              Metric Mappings:
                            </div>
                            {alert.alertMappings.map((mapping, mapIdx) => (
                              <div
                                key={mapIdx}
                                className="text-xs bg-blue-50 p-2 rounded mb-2 last:mb-0"
                              >
                                <div className="flex flex-wrap gap-2 mb-1">
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                                    Domain: {mapping.domain}
                                  </span>
                                  <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded">
                                    Metric: {mapping.metric}
                                  </span>
                                  {mapping.confidence && (
                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded">
                                      Confidence: {(parseFloat(mapping.confidence) * 100).toFixed(0)}%
                                    </span>
                                  )}
                                </div>
                                {mapping.notes && (
                                  <p className="text-gray-700 italic mt-1">{mapping.notes}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {(alert.host || alert.path || alert.status_code) && (
                          <div className="mt-2 text-xs text-gray-600">
                            {alert.host && <span>Host: {alert.host}</span>}
                            {alert.path && <span className="ml-3">Path: {alert.path}</span>}
                            {alert.status_code && (
                              <span className="ml-3">Status: {alert.status_code}</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-bharatpe-blue text-white rounded-lg hover:bg-bharatpe-blue-dark transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

