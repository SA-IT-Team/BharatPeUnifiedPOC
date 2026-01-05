import React, { useState, useMemo } from 'react'
import DataGrid, { Column, Paging, FilterRow, HeaderFilter, SearchPanel } from 'devextreme-react/data-grid'
import { HourlyMetricData } from '../../lib/types'
import { formatPercent } from '../../lib/utils'

interface HourlyMetricsDataGridProps {
  data: HourlyMetricData[]
  onRowClick?: (hour: number) => void
}

export function HourlyMetricsDataGrid({ data, onRowClick }: HourlyMetricsDataGridProps) {
  const gridData = useMemo(() => {
    return data.map(item => ({
      hour: item.hour,
      hourDisplay: `${item.hour}:00`,
      day0: item.day0,
      day1: item.day1,
      day7: item.day7,
      deltaDay1: item.deltaDay1,
      deltaDay7: item.deltaDay7,
      deltaDay1Display: formatPercent(item.deltaDay1),
      deltaDay7Display: formatPercent(item.deltaDay7),
      isAnomaly: item.isAnomaly
    }))
  }, [data])

  const onRowClickHandler = (e: any) => {
    if (onRowClick && e.data) {
      onRowClick(e.data.hour)
    }
  }

  const customizeCell = (cellInfo: any) => {
    if (cellInfo.data.isAnomaly) {
      return {
        backgroundColor: '#FEF2F2',
        borderLeft: '4px solid #FA6C61'
      }
    }
    if (cellInfo.column?.dataField === 'deltaDay1Display' || cellInfo.column?.dataField === 'deltaDay7Display') {
      const delta = cellInfo.column?.dataField === 'deltaDay1Display' 
        ? cellInfo.data.deltaDay1 
        : cellInfo.data.deltaDay7
      if (delta !== null && delta < 0) {
        return { color: '#FA6C61', fontWeight: 'bold' }
      }
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
        onRowClick={onRowClickHandler}
        columnAutoWidth={false}
        wordWrapEnabled={true}
        customizeCell={customizeCell}
        allowColumnResizing={true}
        columnResizingMode="widget"
        headerFilter={{ allowSearch: true }}
      >
      <Paging defaultPageSize={5} pageSizeSelector={[5, 10, 20]} />
      <FilterRow visible={false} />
      <HeaderFilter visible={true} allowSelectAll={true} />
      <SearchPanel visible={true} width={240} placeholder="Search..." />
      
      <Column 
        dataField="hourDisplay" 
        caption="Hour"
        width={80}
        allowSorting={true}
      />
      <Column 
        dataField="day0" 
        caption="DAY-0"
        dataType="number"
        format="#,##0"
        allowSorting={true}
      />
      <Column 
        dataField="day1" 
        caption="DAY-1"
        dataType="number"
        format="#,##0"
        allowSorting={true}
      />
      <Column 
        dataField="day7" 
        caption="DAY-7"
        dataType="number"
        format="#,##0"
        allowSorting={true}
      />
      <Column 
        dataField="deltaDay1Display" 
        caption="%Δ vs DAY-1"
        allowSorting={true}
      />
      <Column 
        dataField="deltaDay7Display" 
        caption="%Δ vs DAY-7"
        allowSorting={true}
      />
    </DataGrid>
    </div>
  )
}

