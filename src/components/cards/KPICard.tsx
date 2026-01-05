import React from 'react'

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: React.ReactNode
  color?: 'blue' | 'red' | 'green'
}

export function KPICard({ 
  title, 
  value, 
  subtitle, 
  trend, 
  icon,
  color = 'blue'
}: KPICardProps) {
  const colorClasses = {
    blue: 'bg-bharatpe-blue-light border-bharatpe-blue',
    red: 'bg-bharatpe-red-light border-bharatpe-red',
    green: 'bg-bharatpe-green-light border-bharatpe-green'
  }

  const textColorClasses = {
    blue: 'text-bharatpe-blue',
    red: 'text-bharatpe-red',
    green: 'text-bharatpe-green'
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border-l-4 p-6 ${colorClasses[color]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${textColorClasses[color]} mb-1`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className={`${textColorClasses[color]} opacity-80`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}


