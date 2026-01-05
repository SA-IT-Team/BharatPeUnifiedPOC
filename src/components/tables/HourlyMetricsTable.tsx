import { useState, useMemo, useEffect } from 'react'
import { HourlyMetricData } from '../../lib/types'
import { formatPercent } from '../../lib/utils'
import { Pagination } from '../ui/Pagination'

interface HourlyMetricsTableProps {
  data: HourlyMetricData[]
  onRowClick?: (hour: number) => void
  itemsPerPage?: number
}

export function HourlyMetricsTable({ 
  data, 
  onRowClick,
  itemsPerPage = 5
}: HourlyMetricsTableProps) {
  const [currentPage, setCurrentPage] = useState(1)

  // Reset to page 1 when data changes
  useEffect(() => {
    setCurrentPage(1)
  }, [data.length])

  const totalPages = Math.ceil(data.length / itemsPerPage)
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return data.slice(startIndex, endIndex)
  }, [data, currentPage, itemsPerPage])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hour
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                DAY-0
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                DAY-1
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                DAY-7
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                %Δ vs DAY-1
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                %Δ vs DAY-7
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((row) => (
              <tr
                key={row.hour}
                onClick={() => onRowClick?.(row.hour)}
                className={`hover:bg-gray-50 ${
                  row.isAnomaly 
                    ? 'bg-bharatpe-red-light border-l-4 border-bharatpe-red cursor-pointer' 
                    : onRowClick ? 'cursor-pointer' : ''
                }`}
              >
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {row.hour}:00
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {row.day0.toLocaleString()}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {row.day1.toLocaleString()}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {row.day7.toLocaleString()}
                </td>
                <td className={`px-4 py-3 whitespace-nowrap text-sm ${
                  row.deltaDay1 !== null && row.deltaDay1 < 0 
                    ? 'text-bharatpe-red font-semibold' 
                    : 'text-gray-900'
                }`}>
                  {formatPercent(row.deltaDay1)}
                </td>
                <td className={`px-4 py-3 whitespace-nowrap text-sm ${
                  row.deltaDay7 !== null && row.deltaDay7 < 0 
                    ? 'text-bharatpe-red font-semibold' 
                    : 'text-gray-900'
                }`}>
                  {formatPercent(row.deltaDay7)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.length > itemsPerPage && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={data.length}
          itemsPerPage={itemsPerPage}
        />
      )}
    </div>
  )
}

