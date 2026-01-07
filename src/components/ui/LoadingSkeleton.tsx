import React from 'react'

interface LoadingSkeletonProps {
  type?: 'card' | 'chart' | 'table' | 'kpi'
  count?: number
}

export function LoadingSkeleton({ type = 'card', count = 1 }: LoadingSkeletonProps) {
  if (type === 'kpi') {
    return (
      <div className="bg-white rounded-lg shadow-sm border-l-4 p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-1"></div>
        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
      </div>
    )
  }

  if (type === 'chart') {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-80 bg-gray-100 rounded"></div>
      </div>
    )
  }

  if (type === 'table') {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-100 rounded"></div>
        <div className="h-4 bg-gray-100 rounded w-5/6"></div>
        <div className="h-4 bg-gray-100 rounded w-4/6"></div>
      </div>
    </div>
  )
}


