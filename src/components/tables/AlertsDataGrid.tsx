import React, { useMemo } from 'react'
import DataGrid, { 
  Column, 
  Paging, 
  FilterRow, 
  HeaderFilter, 
  SearchPanel,
  ColumnChooser,
  ColumnFixing,
  MasterDetail
} from 'devextreme-react/data-grid'
import { CorrelatedAlert } from '../../lib/types'
import { formatIST, toIST } from '../../lib/utils'

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
      </div>
    </div>
  )
}

export function AlertsDataGrid({ alerts, loading }: AlertsDataGridProps) {
  const gridData = useMemo(() => {
    return alerts.map(alert => {
      const istDate = toIST(alert.triggered_at)
      return {
        ...alert,
        triggeredAtIST: formatIST(istDate)
      }
    })
  }, [alerts])

  const customizeCell = (cellInfo: any) => {
    // Only apply row-level styling, badges are handled by cellRender
    return {}
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
        customizeCell={customizeCell}
        height={600}
        allowColumnResizing={true}
        columnResizingMode="widget"
        headerFilter={{ allowSearch: true }}
      >
        <Paging defaultPageSize={5} pageSizeSelector={[5, 10, 20]} />
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
            const getSourceStyle = () => {
              if (source === 'coralogix') return { backgroundColor: '#E6F7FB', color: '#07A0C0' }
              if (source === 'cloudflare') return { backgroundColor: '#FFEDD5', color: '#9A3412' }
              if (source === 'sentry') return { backgroundColor: '#FEF2F2', color: '#FA6C61' }
              if (source === 'slack') return { backgroundColor: '#F3E8FF', color: '#6B21A8' }
              return { backgroundColor: '#F3F4F6', color: '#1F2937' }
            }
            return (
              <span 
                style={{
                  ...getSourceStyle(),
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  display: 'inline-block'
                }}
              >
                {source}
              </span>
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
            const isP1 = priority === 'p1'
            return (
              <span 
                style={{
                  backgroundColor: isP1 ? '#FEF2F2' : '#FEFCE8',
                  color: isP1 ? '#FA6C61' : '#CA8A04',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600',
                  display: 'inline-block'
                }}
              >
                {priority?.toUpperCase() || ''}
              </span>
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
            const statusCode = parseInt(data.value || '0')
            const getStatusStyle = () => {
              if (statusCode >= 500) return { backgroundColor: '#FEF2F2', color: '#FA6C61' }
              if (statusCode >= 400) return { backgroundColor: '#FEFCE8', color: '#CA8A04' }
              return { backgroundColor: '#E6F7F6', color: '#007C77' }
            }
            return (
              <span 
                style={{
                  ...getStatusStyle(),
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '500',
                  display: 'inline-block'
                }}
              >
                {data.value || 'N/A'}
              </span>
            )
          }}
        />
        <Column 
          dataField="value" 
          caption="Value"
          width={120}
          allowSorting={true}
        />
        
        <MasterDetail
          enabled={true}
          template={(data: any) => <DetailTemplate data={data.data} />}
        />
      </DataGrid>
      </div>
    </div>
  )
}

