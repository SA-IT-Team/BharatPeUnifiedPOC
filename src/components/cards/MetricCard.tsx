import React from 'react'

interface MetricCardProps {
  title: string
  children: React.ReactNode
  className?: string
  actionButton?: React.ReactNode
}

export function MetricCard({ title, children, className = '', actionButton }: MetricCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
        {actionButton && <div>{actionButton}</div>}
      </div>
      {children}
    </div>
  )
}

