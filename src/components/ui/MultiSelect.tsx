import { useState } from 'react'

interface MultiSelectProps {
  label?: string
  options: { value: string; label: string }[]
  value: string[]
  onChange: (value: string[]) => void
  className?: string
}

export function MultiSelect({ 
  label, 
  options, 
  value, 
  onChange, 
  className = '' 
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue))
    } else {
      onChange([...value, optionValue])
    }
  }

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md shadow-sm bg-white text-left focus:outline-none focus:ring-1 focus:ring-bharatpe-blue focus:border-bharatpe-blue"
        >
          {value.length === 0 
            ? 'Select...' 
            : `${value.length} selected`}
        </button>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {options.map(option => (
                <label
                  key={option.value}
                  className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={value.includes(option.value)}
                    onChange={() => toggleOption(option.value)}
                    className="mr-2"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

