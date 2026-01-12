import { useMemo } from 'react'
import DataGrid, { Column, Paging, FilterRow, HeaderFilter, SearchPanel, Sorting } from 'devextreme-react/data-grid'
import { HourlyAllMetricsData } from '../../lib/types'

interface HourlyMetricsDataGridProps {
  data: HourlyAllMetricsData[]
  onRowClick?: (hour: number) => void
}

export function HourlyMetricsDataGrid({ data, onRowClick }: HourlyMetricsDataGridProps) {
  const gridData = useMemo(() => {
    // Keep data in ascending order (0, 1, 2... 23)
    return data.map(item => ({
      hour: item.hour,
      hourDisplay: `${item.hour}:00`,
      applications_created: item.applications_created,
      applications_submitted: item.applications_submitted,
      applications_pending: item.applications_pending,
      applications_approved: item.applications_approved,
      applications_nached: item.applications_nached,
      autopay_done_applications: item.autopay_done_applications,
      isAnomaly: item.isAnomaly
    }))
  }, [data])

  const onRowClickHandler = (e: any) => {
    if (onRowClick && e.data) {
      onRowClick(e.data.hour)
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
        allowColumnResizing={true}
        columnResizingMode="widget"
        headerFilter={{ allowSearch: true }}
      >
      <Paging defaultPageSize={10} pageSizeSelector={[5, 10, 20, 30]} />
      <FilterRow visible={true} />
      <HeaderFilter visible={true} allowSelectAll={true} />
      <SearchPanel visible={true} width={240} placeholder="Search..." />
      <Sorting mode="single" />
      
      <Column 
        dataField="hourDisplay" 
        caption="Hour"
        width={100}
        allowSorting={true}
        fixed={true}
      />
      <Column 
        dataField="applications_created" 
        caption="Created"
        dataType="number"
        format="#,##0"
        allowSorting={true}
      />
      <Column 
        dataField="applications_submitted" 
        caption="Submitted"
        dataType="number"
        format="#,##0"
        allowSorting={true}
      />
      <Column 
        dataField="applications_pending" 
        caption="Pending"
        dataType="number"
        format="#,##0"
        allowSorting={true}
      />
      <Column 
        dataField="applications_approved" 
        caption="Approved"
        dataType="number"
        format="#,##0"
        allowSorting={true}
      />
      <Column 
        dataField="applications_nached" 
        caption="NACHed"
        dataType="number"
        format="#,##0"
        allowSorting={true}
      />
      <Column 
        dataField="autopay_done_applications" 
        caption="Autopay Done"
        dataType="number"
        format="#,##0"
        allowSorting={true}
      />
    </DataGrid>
    </div>
  )
}

