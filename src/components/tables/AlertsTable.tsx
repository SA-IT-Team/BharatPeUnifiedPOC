import React, { useState, useMemo, useEffect } from 'react'
import { CorrelatedAlert } from '../../lib/types'
import { formatIST, toIST } from '../../lib/utils'
import { Pagination } from '../ui/Pagination'
import { MultiSelect } from '../ui/MultiSelect'

interface AlertsTableProps {
  alerts: CorrelatedAlert[]
  loading?: boolean
  itemsPerPage?: number
}

export function AlertsTable({ alerts, loading, itemsPerPage = 5 }: AlertsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  
  // Column filters
  const [filters, setFilters] = useState({
    triggeredAt: [] as string[],
    source: [] as string[],
    priority: [] as string[],
    alertName: '',
    hostPathStatus: '',
    value: [] as string[]
  })

  // Extract unique values for multi-select filters
  const filterOptions = useMemo(() => {
    const uniqueDates = Array.from(new Set(
      alerts.map(alert => {
        const istDate = toIST(alert.triggered_at)
        return formatIST(istDate).split(' ')[0] // Get just the date part
      })
    )).sort().reverse() // Most recent first

    const uniqueSources = Array.from(new Set(
      alerts.map(alert => alert.source).filter(Boolean)
    )).sort()

    const uniquePriorities = Array.from(new Set(
      alerts.map(alert => alert.priority).filter(Boolean)
    )).sort()

    const uniqueValues = Array.from(new Set(
      alerts.map(alert => alert.value).filter(Boolean)
    )).sort()

    return {
      dates: uniqueDates.map(date => ({ value: date, label: date })),
      sources: uniqueSources.map(source => ({ value: source, label: source })),
      priorities: uniquePriorities.map(priority => ({ value: priority, label: priority.toUpperCase() })),
      values: uniqueValues.map(value => ({ value: value, label: value }))
    }
  }, [alerts])

  // Reset to page 1 when data or filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [alerts.length, filters])

  // Filter alerts based on column filters
  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      const istDate = toIST(alert.triggered_at)
      const dateStr = formatIST(istDate).split(' ')[0] // Get just the date part
      
      const hostPathStatusStr = [
        alert.host,
        alert.path,
        alert.status_code
      ].filter(Boolean).join(' ').toLowerCase()

      return (
        (filters.triggeredAt.length === 0 || filters.triggeredAt.includes(dateStr)) &&
        (filters.source.length === 0 || filters.source.includes(alert.source || '')) &&
        (filters.priority.length === 0 || filters.priority.includes(alert.priority || '')) &&
        (!filters.alertName || (alert.alert_name || '').toLowerCase().includes(filters.alertName.toLowerCase())) &&
        (!filters.hostPathStatus || hostPathStatusStr.includes(filters.hostPathStatus.toLowerCase())) &&
        (filters.value.length === 0 || filters.value.includes(alert.value || ''))
      )
    })
  }, [alerts, filters])

  const totalPages = Math.ceil(filteredAlerts.length / itemsPerPage)
  const paginatedAlerts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredAlerts.slice(startIndex, endIndex)
  }, [filteredAlerts, currentPage, itemsPerPage])

  const toggleRow = (alertIndex: number) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(alertIndex)) {
      newExpanded.delete(alertIndex)
    } else {
      newExpanded.add(alertIndex)
    }
    setExpandedRows(newExpanded)
  }

  const handleFilterChange = (column: string, value: string | string[]) => {
    setFilters(prev => ({ ...prev, [column]: value }))
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">
        Loading alerts...
      </div>
    )
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No alerts found
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden max-w-6xl">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex flex-col space-y-1">
                  <span>Triggered At (IST)</span>
                  <div onClick={(e) => e.stopPropagation()}>
                    <MultiSelect
                      options={filterOptions.dates}
                      value={filters.triggeredAt}
                      onChange={(value) => handleFilterChange('triggeredAt', value)}
                      className="text-xs"
                    />
                  </div>
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex flex-col space-y-1">
                  <span>Source</span>
                  <div onClick={(e) => e.stopPropagation()}>
                    <MultiSelect
                      options={filterOptions.sources}
                      value={filters.source}
                      onChange={(value) => handleFilterChange('source', value)}
                      className="text-xs"
                    />
                  </div>
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex flex-col space-y-1">
                  <span>Priority</span>
                  <div onClick={(e) => e.stopPropagation()}>
                    <MultiSelect
                      options={filterOptions.priorities}
                      value={filters.priority}
                      onChange={(value) => handleFilterChange('priority', value)}
                      className="text-xs"
                    />
                  </div>
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex flex-col space-y-1">
                  <span>Alert Name</span>
                  <input
                    type="text"
                    placeholder="Filter..."
                    value={filters.alertName}
                    onChange={(e) => handleFilterChange('alertName', e.target.value)}
                    className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-bharatpe-blue focus:border-bharatpe-blue"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex flex-col space-y-1">
                  <span>Host/Path/Status</span>
                  <input
                    type="text"
                    placeholder="Filter..."
                    value={filters.hostPathStatus}
                    onChange={(e) => handleFilterChange('hostPathStatus', e.target.value)}
                    className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-bharatpe-blue focus:border-bharatpe-blue"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex flex-col space-y-1">
                  <span>Value</span>
                  <div onClick={(e) => e.stopPropagation()}>
                    <MultiSelect
                      options={filterOptions.values}
                      value={filters.value}
                      onChange={(value) => handleFilterChange('value', value)}
                      className="text-xs"
                    />
                  </div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedAlerts.map((alert, index) => {
              const alertIndex = filteredAlerts.findIndex(a => 
                a.triggered_at === alert.triggered_at && 
                a.alert_name === alert.alert_name &&
                a.source === alert.source
              )
              const isExpanded = expandedRows.has(alertIndex)
              const istDate = toIST(alert.triggered_at)
            
            return (
              <React.Fragment key={`${alert.triggered_at}-${alert.alert_name}-${index}`}>
                <tr
                  onClick={() => toggleRow(alertIndex)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {formatIST(istDate)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    <span className={`px-2 py-1 rounded text-xs ${
                      alert.source === 'coralogix' ? 'bg-bharatpe-blue-light text-bharatpe-blue-dark' :
                      alert.source === 'cloudflare' ? 'bg-orange-100 text-orange-800' :
                      alert.source === 'sentry' ? 'bg-bharatpe-red-light text-bharatpe-red' :
                      alert.source === 'slack' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {alert.source}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      alert.priority === 'p1' 
                        ? 'bg-bharatpe-red-light text-bharatpe-red' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {alert.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {alert.alert_name || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {alert.host && <div>{alert.host}</div>}
                    {alert.path && <div className="text-xs text-gray-500">{alert.path}</div>}
                    {alert.status_code && (
                      <div className="text-xs">
                        <span className={`px-1 rounded ${
                          parseInt(alert.status_code) >= 500 
                            ? 'bg-bharatpe-red-light text-bharatpe-red' :
                          parseInt(alert.status_code) >= 400 
                            ? 'bg-yellow-100 text-yellow-800' :
                          'bg-bharatpe-green-light text-bharatpe-green'
                        }`}>
                          {alert.status_code}
                        </span>
                      </div>
                    )}
                    {!alert.host && !alert.path && !alert.status_code && 'N/A'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {alert.value || 'N/A'}
                  </td>
                </tr>
                {isExpanded && (
                  <tr>
                    <td colSpan={6} className="px-4 py-3 bg-gray-50">
                      <div className="space-y-2">
                        {alert.message && (
                          <div>
                            <div className="text-xs font-semibold text-gray-700 mb-1">Message:</div>
                            <div className="text-sm text-gray-900 whitespace-pre-wrap">{alert.message}</div>
                          </div>
                        )}
                        {alert.sample_log && (
                          <div>
                            <div className="text-xs font-semibold text-gray-700 mb-1">Sample Log:</div>
                            <div className="text-sm text-gray-900 font-mono bg-gray-100 p-2 rounded whitespace-pre-wrap overflow-x-auto">
                              {alert.sample_log}
                            </div>
                          </div>
                        )}
                        {alert.alert_query && (
                          <div>
                            <div className="text-xs font-semibold text-gray-700 mb-1">Query:</div>
                            <div className="text-sm text-gray-900 font-mono bg-gray-100 p-2 rounded">
                              {alert.alert_query}
                            </div>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          {alert.team && (
                            <div>
                              <span className="font-semibold text-gray-700">Team:</span> {alert.team}
                            </div>
                          )}
                          {alert.application && (
                            <div>
                              <span className="font-semibold text-gray-700">Application:</span> {alert.application}
                            </div>
                          )}
                          {alert.subsystem && (
                            <div>
                              <span className="font-semibold text-gray-700">Subsystem:</span> {alert.subsystem}
                            </div>
                          )}
                          {alert.severity && (
                            <div>
                              <span className="font-semibold text-gray-700">Severity:</span> {alert.severity}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
      </div>
      {filteredAlerts.length > itemsPerPage && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={filteredAlerts.length}
          itemsPerPage={itemsPerPage}
        />
      )}
    </div>
  )
}

