import React from 'react'

interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

export function DatePicker({ label, className = '', ...props }: DatePickerProps) {
  const inputClasses = `w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-bharatpe-blue focus:border-bharatpe-blue ${className}`
  
  if (label) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
        <input type="date" className={inputClasses} {...props} />
      </div>
    )
  }
  
  return <input type="date" className={inputClasses} {...props} />
}

