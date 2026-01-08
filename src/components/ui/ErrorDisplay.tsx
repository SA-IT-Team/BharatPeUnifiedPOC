import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface ErrorDisplayProps {
  error: Error | string
  onRetry?: () => void
  title?: string
}

export function ErrorDisplay({ error, onRetry, title }: ErrorDisplayProps) {
  const errorMessage = typeof error === 'string' ? error : error.message

  return (
    <div className="bg-bharatpe-red-light border border-bharatpe-red rounded-lg p-4">
      <div className="flex items-start">
        <AlertCircle className="text-bharatpe-red mt-0.5 mr-3 flex-shrink-0" size={20} />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-bharatpe-red mb-1">
            {title || 'Error Loading Data'}
          </h4>
          <p className="text-sm text-gray-700 mb-3">{errorMessage}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-bharatpe-red bg-white border border-bharatpe-red rounded-md hover:bg-bharatpe-red-light transition-colors"
            >
              <RefreshCw size={14} className="mr-2" />
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  )
}




