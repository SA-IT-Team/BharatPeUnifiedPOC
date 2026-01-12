import { useEffect } from 'react'
import { CheckCircle, X } from 'lucide-react'

interface NotificationProps {
  message: string
  isVisible: boolean
  onClose: () => void
}

export function Notification({ message, isVisible, onClose }: NotificationProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose])

  if (!isVisible) return null

  return (
    <div className="fixed top-4 right-4 z-50 transition-all duration-300 ease-in-out">
      <div className="bg-white border border-green-200 rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[300px]">
        <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
        <span className="text-sm text-gray-900 flex-1">{message}</span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 flex-shrink-0"
          aria-label="Close notification"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

