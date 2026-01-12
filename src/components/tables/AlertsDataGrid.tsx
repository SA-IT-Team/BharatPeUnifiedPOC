import React, { useMemo, useState } from 'react'
import DataGrid, { 
  Column, 
  Paging,
  Pager,
  FilterRow, 
  HeaderFilter, 
  SearchPanel,
  ColumnChooser,
  ColumnFixing,
  MasterDetail
} from 'devextreme-react/data-grid'
import { CorrelatedAlert } from '../../lib/types'
import { formatIST, toIST } from '../../lib/utils'
import { ActionsPopup } from '../ui/ActionsPopup'
import { Notification } from '../ui/Notification'

interface AlertsDataGridProps {
  alerts: CorrelatedAlert[]
  loading?: boolean
}

const DetailTemplate = ({ data }: { data: CorrelatedAlert }) => {
  return (
    <div className="p-4 space-y-3">
      {data.message && (
        <div>
          <div className="text-xs font-semibold text-gray-700 mb-1">Message:</div>
          <div className="text-sm text-gray-900 whitespace-pre-wrap">{data.message}</div>
        </div>
      )}
      {data.sample_log && (
        <div>
          <div className="text-xs font-semibold text-gray-700 mb-1">Sample Log:</div>
          <div className="text-sm text-gray-900 font-mono bg-gray-100 p-2 rounded whitespace-pre-wrap overflow-x-auto">
            {data.sample_log}
          </div>
        </div>
      )}
      {data.alert_query && (
        <div>
          <div className="text-xs font-semibold text-gray-700 mb-1">Query:</div>
          <div className="text-sm text-gray-900 font-mono bg-gray-100 p-2 rounded">
            {data.alert_query}
          </div>
        </div>
      )}
      
      {data.alertMappings && data.alertMappings.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs font-semibold text-gray-700 mb-2">Alert Metric Mapping:</div>
          <div className="space-y-2">
            {data.alertMappings.map((mapping, idx) => (
              <div key={idx} className="bg-blue-50 p-3 rounded border border-blue-200">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="font-semibold text-gray-700">Domain:</span>
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                      {mapping.domain}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Affected Metric:</span>
                    <span className="ml-2 text-gray-900">{mapping.metric}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Confidence:</span>
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                      {(parseFloat(mapping.confidence || '0') * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Match Rule:</span>
                    <span className="ml-2 text-gray-900 text-xs">
                      {mapping.match_field} {mapping.match_type} "{mapping.match_value}"
                    </span>
                  </div>
                </div>
                {mapping.notes && (
                  <div className="mt-2 pt-2 border-t border-blue-200">
                    <span className="font-semibold text-gray-700 text-xs">Notes:</span>
                    <div className="text-xs text-gray-700 mt-1">{mapping.notes}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4 text-xs">
        {data.team && (
          <div>
            <span className="font-semibold text-gray-700">Team:</span> {data.team}
          </div>
        )}
        {data.application && (
          <div>
            <span className="font-semibold text-gray-700">Application:</span> {data.application}
          </div>
        )}
        {data.subsystem && (
          <div>
            <span className="font-semibold text-gray-700">Subsystem:</span> {data.subsystem}
          </div>
        )}
        {data.severity && (
          <div>
            <span className="font-semibold text-gray-700">Severity:</span> {data.severity}
          </div>
        )}
        {data.correlationScore && (
          <div>
            <span className="font-semibold text-gray-700">Correlation Score:</span>
            <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
              {(data.correlationScore * 100).toFixed(0)}%
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export function AlertsDataGrid({ alerts, loading }: AlertsDataGridProps) {
  const [popupOpen, setPopupOpen] = useState(false)
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 })
  const [notification, setNotification] = useState({ isVisible: false, message: '' })

  const gridData = useMemo(() => {
    return alerts.map(alert => {
      const istDate = toIST(alert.triggered_at)
      return {
        ...alert,
        triggeredAtIST: formatIST(istDate)
      }
    })
  }, [alerts])

  const handleActionsClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    const popupWidth = 200
    const popupHeight = 140
    let left = rect.left
    let top = rect.bottom + 5

    if (left + popupWidth > window.innerWidth) {
      left = window.innerWidth - popupWidth - 10
    }
    if (top + popupHeight > window.innerHeight) {
      top = rect.top - popupHeight - 5
    }

    setPopupPosition({ top, left })
    setPopupOpen(true)
  }

  const showNotification = (message: string) => {
    setNotification({ isVisible: true, message })
  }

  const handleNotifySupport = () => {
    showNotification('Support team notified successfully')
  }

  const handleAlertServices = () => {
    showNotification('Services team alerted successfully')
  }

  const handleFixService = () => {
    showNotification('Service fix initiated successfully')
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
    <div className="max-w-6xl" style={{ width: '100%' }}>
      <div className="dx-datagrid" style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
      <DataGrid
        dataSource={gridData}
        showBorders={true}
        rowAlternationEnabled={true}
        columnAutoWidth={false}
        wordWrapEnabled={true}
        height={600}
        allowColumnResizing={true}
        columnResizingMode="widget"
        headerFilter={{ allowSearch: true }}
      >
        <Paging defaultPageSize={5} />
        <Pager allowedPageSizes={[5, 10, 20]} showPageSizeSelector={true} />
        <FilterRow visible={false} />
        <HeaderFilter visible={true} allowSelectAll={true} />
        <SearchPanel visible={true} width={240} placeholder="Search..." />
        <ColumnChooser enabled={true} />
        <ColumnFixing enabled={true} />
        
        <Column 
          dataField="triggeredAtIST" 
          caption="Triggered At (IST)"
          width={180}
          allowSorting={true}
          dataType="string"
        />
        <Column 
          dataField="source" 
          caption="Source"
          width={120}
          allowSorting={true}
          cellRender={(data: any) => {
            const source = data.value
            if (!source) return <span>N/A</span>
            
            const getSourceStyle = () => {
              if (source === 'coralogix') return { backgroundColor: '#E6F7FB', color: '#07A0C0' }
              if (source === 'cloudflare') return { backgroundColor: '#FFEDD5', color: '#9A3412' }
              if (source === 'sentry') return { backgroundColor: '#FEF2F2', color: '#FA6C61' }
              if (source === 'slack') return { backgroundColor: '#F3E8FF', color: '#6B21A8' }
              return { backgroundColor: '#F3F4F6', color: '#1F2937' }
            }
            const style = {
              ...getSourceStyle(),
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              display: 'inline-block',
              fontWeight: '500',
              border: 'none',
              outline: 'none'
            }
            return (
              <div style={style}>
                {source}
              </div>
            )
          }}
        />
        <Column 
          dataField="priority" 
          caption="Priority"
          width={100}
          allowSorting={true}
          cellRender={(data: any) => {
            const priority = data.value
            if (!priority) return <span>N/A</span>
            
            const isP1 = priority.toLowerCase() === 'p1'
            const style: React.CSSProperties = {
              backgroundColor: isP1 ? '#FEF2F2' : '#FEFCE8',
              color: isP1 ? '#FA6C61' : '#CA8A04',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '600',
              display: 'inline-block',
              minWidth: '32px',
              textAlign: 'center' as const,
              border: 'none',
              outline: 'none'
            }
            return (
              <div style={style}>
                {priority.toUpperCase()}
              </div>
            )
          }}
        />
        <Column 
          dataField="alert_name" 
          caption="Alert Name"
          width={200}
          allowSorting={true}
        />
        <Column 
          dataField="host" 
          caption="Host"
          width={150}
          allowSorting={true}
        />
        <Column 
          dataField="path" 
          caption="Path"
          width={200}
          allowSorting={true}
        />
        <Column 
          dataField="status_code" 
          caption="Status"
          width={100}
          allowSorting={true}
          cellRender={(data: any) => {
            const value = data.value
            if (!value || value === 'N/A') {
              return <span style={{ color: '#6b7280' }}>N/A</span>
            }
            
            const statusCode = parseInt(value || '0')
            const getStatusStyle = () => {
              if (statusCode >= 500) return { backgroundColor: '#FEF2F2', color: '#FA6C61' }
              if (statusCode >= 400) return { backgroundColor: '#FEFCE8', color: '#CA8A04' }
              return { backgroundColor: '#E6F7F6', color: '#007C77' }
            }
            const style: React.CSSProperties = {
              ...getStatusStyle(),
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '500',
              display: 'inline-block',
              minWidth: '40px',
              textAlign: 'center' as const,
              border: 'none',
              outline: 'none'
            }
            return (
              <div style={style}>
                {value}
              </div>
            )
          }}
        />
        <Column 
          dataField="value" 
          caption="Value"
          width={120}
          allowSorting={true}
        />
        <Column
          caption="Actions"
          width={100}
          allowSorting={false}
          cellRender={() => {
            return (
              <button
                onClick={(e) => handleActionsClick(e)}
                className="px-3 py-1 text-sm font-medium text-white bg-bharatpe-green hover:opacity-90 rounded transition-colors"
              >
                Actions
              </button>
            )
          }}
        />
        
        <MasterDetail
          enabled={true}
          template={(data: any) => <DetailTemplate data={data.data} />}
        />
      </DataGrid>
      </div>
      <ActionsPopup
        isOpen={popupOpen}
        onClose={() => setPopupOpen(false)}
        onNotifySupport={handleNotifySupport}
        onAlertServices={handleAlertServices}
        onFixService={handleFixService}
        position={popupPosition}
      />
      <Notification
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={() => setNotification({ isVisible: false, message: '' })}
      />
    </div>
  )
}

