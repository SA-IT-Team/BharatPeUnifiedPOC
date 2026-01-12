import { AlertCircle, Database, Search } from 'lucide-react'

interface EmptyStateProps {
  type: 'no-data' | 'no-alerts' | 'no-anomalies' | 'no-results'
  title?: string
  message?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ type, title, message, action }: EmptyStateProps) {
  const getIcon = () => {
    switch (type) {
      case 'no-data':
        return <Database size={48} className="text-gray-400" />
      case 'no-alerts':
        return <AlertCircle size={48} className="text-gray-400" />
      case 'no-anomalies':
        return <AlertCircle size={48} className="text-green-500" />
      case 'no-results':
        return <Search size={48} className="text-gray-400" />
      default:
        return <Database size={48} className="text-gray-400" />
    }
  }

  const getDefaultTitle = () => {
    switch (type) {
      case 'no-data':
        return 'No Data Available'
      case 'no-alerts':
        return 'No Alerts Found'
      case 'no-anomalies':
        return 'No Anomalies Detected'
      case 'no-results':
        return 'No Results Found'
      default:
        return 'No Data'
    }
  }

  const getDefaultMessage = () => {
    switch (type) {
      case 'no-data':
        return 'No metrics data found for the selected date range. Try selecting a different date.'
      case 'no-alerts':
        return 'No alerts match your current filters. Try adjusting your search criteria or time range.'
      case 'no-anomalies':
        return 'Great news! No anomalies detected in the selected time period.'
      case 'no-results':
        return 'No results match your search. Try different filters or search terms.'
      default:
        return 'No data available'
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="mb-4">{getIcon()}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title || getDefaultTitle()}
      </h3>
      <p className="text-sm text-gray-600 text-center max-w-md mb-4">
        {message || getDefaultMessage()}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-bharatpe-blue text-white rounded-md hover:bg-bharatpe-blue-dark transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}





