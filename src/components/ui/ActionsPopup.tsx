import { X, Bell, AlertTriangle, Wrench } from 'lucide-react'

interface ActionsPopupProps {
  isOpen: boolean
  onClose: () => void
  onNotifySupport: () => void
  onAlertServices: () => void
  onFixService: () => void
  position: { top: number; left: number }
}

export function ActionsPopup({
  isOpen,
  onClose,
  onNotifySupport,
  onAlertServices,
  onFixService,
  position
}: ActionsPopupProps) {
  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[200px]"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`
        }}
      >
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200">
          <span className="text-xs font-semibold text-gray-700">Actions</span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>
        <div className="space-y-1">
          <button
            onClick={() => {
              onNotifySupport()
              onClose()
            }}
            className="w-full text-left px-3 py-2 text-sm text-bharatpe-blue bg-bharatpe-blue-light hover:bg-bharatpe-blue hover:text-white rounded transition-colors flex items-center gap-2"
          >
            <Bell size={16} />
            Notify Support team
          </button>
          <button
            onClick={() => {
              onAlertServices()
              onClose()
            }}
            className="w-full text-left px-3 py-2 text-sm text-bharatpe-red bg-bharatpe-red-light hover:bg-bharatpe-red hover:text-white rounded transition-colors flex items-center gap-2"
          >
            <AlertTriangle size={16} />
            Alert services team
          </button>
          <button
            onClick={() => {
              onFixService()
              onClose()
            }}
            className="w-full text-left px-3 py-2 text-sm text-bharatpe-green bg-bharatpe-green-light hover:bg-bharatpe-green hover:text-white rounded transition-colors flex items-center gap-2"
          >
            <Wrench size={16} />
            Fix the service
          </button>
        </div>
      </div>
    </>
  )
}

