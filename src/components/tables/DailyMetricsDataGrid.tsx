import { useMemo } from 'react'
import DataGrid, { 
  Column, 
  Paging,
  Pager,
  FilterRow, 
  HeaderFilter, 
  SearchPanel,
  ColumnChooser,
  ColumnFixing,
  Sorting
} from 'devextreme-react/data-grid'
import { DailyMetricData } from '../../lib/types'

interface DailyMetricsDataGridProps {
  data: DailyMetricData[]
  onRowClick?: (date: string) => void
}

export function DailyMetricsDataGrid({ data, onRowClick }: DailyMetricsDataGridProps) {
  const gridData = useMemo(() => {
    // Sort data in descending order by date (newest first)
    const sortedData = [...data].sort((a, b) => {
      const dateA = new Date(a.dt).getTime()
      const dateB = new Date(b.dt).getTime()
      return dateB - dateA // Descending order
    })
    
    return sortedData.map((item) => {
      // For delta calculation, we need the previous item in chronological order (not sorted order)
      // Find the previous chronological item
      const sortedChronological = [...data].sort((a, b) => {
        const dateA = new Date(a.dt).getTime()
        const dateB = new Date(b.dt).getTime()
        return dateA - dateB // Ascending for finding previous
      })
      const chronologicalIndex = sortedChronological.findIndex(d => d.dt === item.dt)
      const prevItem = chronologicalIndex > 0 ? sortedChronological[chronologicalIndex - 1] : null
      
      // Calculate change percentage for each metric (day-to-day)
      const calculateDelta = (current: number, previous: number | null): number | null => {
        if (previous === null || previous === 0) return null
        return ((current - previous) / previous) * 100
      }
      
      return {
        date: new Date(item.dt).toLocaleDateString('en-IN'),
        dateKey: item.dt,
        eligible: item.eligible,
        started: item.started,
        kyc_initiated: item.kyc_initiated,
        kyc_completed: item.kyc_completed,
        nach_initiated: item.nach_initiated,
        nach_done: item.nach_done,
        processed: item.processed,
        approved: item.approved,
        submitted: item.submitted,
        disbursed: item.disbursed,
        // Change percentages for each metric (vs previous day)
        deltaEligible: calculateDelta(item.eligible, prevItem?.eligible || null),
        deltaStarted: calculateDelta(item.started, prevItem?.started || null),
        deltaKycInitiated: calculateDelta(item.kyc_initiated, prevItem?.kyc_initiated || null),
        deltaKycCompleted: calculateDelta(item.kyc_completed, prevItem?.kyc_completed || null),
        deltaNachInitiated: calculateDelta(item.nach_initiated, prevItem?.nach_initiated || null),
        deltaNachDone: calculateDelta(item.nach_done, prevItem?.nach_done || null),
        deltaProcessed: calculateDelta(item.processed, prevItem?.processed || null),
        deltaApproved: calculateDelta(item.approved, prevItem?.approved || null),
        deltaSubmitted: calculateDelta(item.submitted, prevItem?.submitted || null),
        deltaDisbursed: item.deltaDisbursed,
        isAnomaly: item.isAnomaly
      }
    })
  }, [data])

  const onRowClickHandler = (e: any) => {
    if (onRowClick && e.data) {
      onRowClick(e.data.dateKey)
    }
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No data available
      </div>
    )
  }

  return (
    <div className="dx-datagrid" style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
      <DataGrid
        dataSource={gridData}
        showBorders={true}
        rowAlternationEnabled={true}
        columnAutoWidth={false}
        wordWrapEnabled={true}
        onRowClick={onRowClickHandler}
        height={600}
        allowColumnResizing={true}
        columnResizingMode="widget"
        headerFilter={{ allowSearch: true }}
      >
        <Paging defaultPageSize={10} />
        <Pager allowedPageSizes={[5, 10, 20, 30]} showPageSizeSelector={true} />
        <FilterRow visible={true} />
        <HeaderFilter visible={true} allowSelectAll={true} />
        <SearchPanel visible={true} width={240} placeholder="Search..." />
        <ColumnChooser enabled={true} />
        <ColumnFixing enabled={true} />
        <Sorting mode="single" />
        
        <Column 
          dataField="date" 
          caption="Date"
          width={120}
          allowSorting={true}
          fixed={true}
        />
        <Column 
          dataField="eligible" 
          caption="Eligible"
          width={120}
          allowSorting={true}
          cellRender={(data: any) => {
            const value = data.value
            const delta = data.data.deltaEligible
            return (
              <div className="flex flex-col">
                <span className="font-medium">{value.toLocaleString()}</span>
                {delta !== null && delta !== undefined ? (
                  <span 
                    style={{ 
                      color: delta < 0 ? '#FA6C61' : '#10B981',
                      fontSize: '11px',
                      fontWeight: '500'
                    }}
                  >
                    {delta >= 0 ? '+' : ''}{delta.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-gray-400 text-xs">-</span>
                )}
              </div>
            )
          }}
        />
        <Column 
          dataField="started" 
          caption="Started"
          width={120}
          allowSorting={true}
          cellRender={(data: any) => {
            const value = data.value
            const delta = data.data.deltaStarted
            return (
              <div className="flex flex-col">
                <span className="font-medium">{value.toLocaleString()}</span>
                {delta !== null && delta !== undefined ? (
                  <span 
                    style={{ 
                      color: delta < 0 ? '#FA6C61' : '#10B981',
                      fontSize: '11px',
                      fontWeight: '500'
                    }}
                  >
                    {delta >= 0 ? '+' : ''}{delta.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-gray-400 text-xs">-</span>
                )}
              </div>
            )
          }}
        />
        <Column 
          dataField="kyc_initiated" 
          caption="KYC Initiated"
          width={130}
          allowSorting={true}
          cellRender={(data: any) => {
            const value = data.value
            const delta = data.data.deltaKycInitiated
            return (
              <div className="flex flex-col">
                <span className="font-medium">{value.toLocaleString()}</span>
                {delta !== null && delta !== undefined ? (
                  <span 
                    style={{ 
                      color: delta < 0 ? '#FA6C61' : '#10B981',
                      fontSize: '11px',
                      fontWeight: '500'
                    }}
                  >
                    {delta >= 0 ? '+' : ''}{delta.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-gray-400 text-xs">-</span>
                )}
              </div>
            )
          }}
        />
        <Column 
          dataField="kyc_completed" 
          caption="KYC Completed"
          width={140}
          allowSorting={true}
          cellRender={(data: any) => {
            const value = data.value
            const delta = data.data.deltaKycCompleted
            return (
              <div className="flex flex-col">
                <span className="font-medium">{value.toLocaleString()}</span>
                {delta !== null && delta !== undefined ? (
                  <span 
                    style={{ 
                      color: delta < 0 ? '#FA6C61' : '#10B981',
                      fontSize: '11px',
                      fontWeight: '500'
                    }}
                  >
                    {delta >= 0 ? '+' : ''}{delta.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-gray-400 text-xs">-</span>
                )}
              </div>
            )
          }}
        />
        <Column 
          dataField="nach_initiated" 
          caption="NACH Initiated"
          width={140}
          allowSorting={true}
          cellRender={(data: any) => {
            const value = data.value
            const delta = data.data.deltaNachInitiated
            return (
              <div className="flex flex-col">
                <span className="font-medium">{value.toLocaleString()}</span>
                {delta !== null && delta !== undefined ? (
                  <span 
                    style={{ 
                      color: delta < 0 ? '#FA6C61' : '#10B981',
                      fontSize: '11px',
                      fontWeight: '500'
                    }}
                  >
                    {delta >= 0 ? '+' : ''}{delta.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-gray-400 text-xs">-</span>
                )}
              </div>
            )
          }}
        />
        <Column 
          dataField="nach_done" 
          caption="NACH Done"
          width={120}
          allowSorting={true}
          cellRender={(data: any) => {
            const value = data.value
            const delta = data.data.deltaNachDone
            return (
              <div className="flex flex-col">
                <span className="font-medium">{value.toLocaleString()}</span>
                {delta !== null && delta !== undefined ? (
                  <span 
                    style={{ 
                      color: delta < 0 ? '#FA6C61' : '#10B981',
                      fontSize: '11px',
                      fontWeight: '500'
                    }}
                  >
                    {delta >= 0 ? '+' : ''}{delta.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-gray-400 text-xs">-</span>
                )}
              </div>
            )
          }}
        />
        <Column 
          dataField="processed" 
          caption="Processed"
          width={120}
          allowSorting={true}
          cellRender={(data: any) => {
            const value = data.value
            const delta = data.data.deltaProcessed
            return (
              <div className="flex flex-col">
                <span className="font-medium">{value.toLocaleString()}</span>
                {delta !== null && delta !== undefined ? (
                  <span 
                    style={{ 
                      color: delta < 0 ? '#FA6C61' : '#10B981',
                      fontSize: '11px',
                      fontWeight: '500'
                    }}
                  >
                    {delta >= 0 ? '+' : ''}{delta.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-gray-400 text-xs">-</span>
                )}
              </div>
            )
          }}
        />
        <Column 
          dataField="approved" 
          caption="Approved"
          width={120}
          allowSorting={true}
          cellRender={(data: any) => {
            const value = data.value
            const delta = data.data.deltaApproved
            return (
              <div className="flex flex-col">
                <span className="font-medium">{value.toLocaleString()}</span>
                {delta !== null && delta !== undefined ? (
                  <span 
                    style={{ 
                      color: delta < 0 ? '#FA6C61' : '#10B981',
                      fontSize: '11px',
                      fontWeight: '500'
                    }}
                  >
                    {delta >= 0 ? '+' : ''}{delta.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-gray-400 text-xs">-</span>
                )}
              </div>
            )
          }}
        />
        <Column 
          dataField="submitted" 
          caption="Submitted"
          width={120}
          allowSorting={true}
          cellRender={(data: any) => {
            const value = data.value
            const delta = data.data.deltaSubmitted
            return (
              <div className="flex flex-col">
                <span className="font-medium">{value.toLocaleString()}</span>
                {delta !== null && delta !== undefined ? (
                  <span 
                    style={{ 
                      color: delta < 0 ? '#FA6C61' : '#10B981',
                      fontSize: '11px',
                      fontWeight: '500'
                    }}
                  >
                    {delta >= 0 ? '+' : ''}{delta.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-gray-400 text-xs">-</span>
                )}
              </div>
            )
          }}
        />
        <Column 
          dataField="disbursed" 
          caption="Disbursed"
          width={120}
          allowSorting={true}
          cellRender={(data: any) => {
            const value = data.value
            const delta = data.data.deltaDisbursed
            return (
              <div className="flex flex-col">
                <span className="font-medium">{value.toLocaleString()}</span>
                {delta !== null && delta !== undefined ? (
                  <span 
                    style={{ 
                      color: delta < 0 ? '#FA6C61' : '#10B981',
                      fontSize: '11px',
                      fontWeight: '500'
                    }}
                  >
                    {delta >= 0 ? '+' : ''}{delta.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-gray-400 text-xs">-</span>
                )}
              </div>
            )
          }}
        />
      </DataGrid>
    </div>
  )
}

