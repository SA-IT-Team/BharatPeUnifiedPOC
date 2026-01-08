import { useState, ReactNode } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface AccordionProps {
  title: string
  children: ReactNode
  defaultExpanded?: boolean
}

export function Accordion({ title, children, defaultExpanded = true }: AccordionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-left"
      >
        <span className="font-medium text-gray-900">{title}</span>
        {isExpanded ? (
          <ChevronUp size={20} className="text-gray-600" />
        ) : (
          <ChevronDown size={20} className="text-gray-600" />
        )}
      </button>
      {isExpanded && (
        <div className="p-4 bg-white">
          {children}
        </div>
      )}
    </div>
  )
}



