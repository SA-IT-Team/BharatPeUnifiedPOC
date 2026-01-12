import { X } from 'lucide-react'
import { DatePicker } from './DatePicker'
import { Select } from './Select'
import { Input } from './Input'
import { MultiSelect } from './MultiSelect'
import { HourlyMetricField } from '../../lib/types'

interface FilterModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: string
  onDateChange: (value: string) => void
  selectedMetric: HourlyMetricField
  onMetricChange: (value: HourlyMetricField) => void
  windowBefore: number
  onWindowBeforeChange: (value: number) => void
  windowAfter: number
  onWindowAfterChange: (value: number) => void
  alertSources: string[]
  onAlertSourcesChange: (value: string[]) => void
  alertPriority: string[]
  onAlertPriorityChange: (value: string[]) => void
  alertSeverity: string[]
  onAlertSeverityChange: (value: string[]) => void
  alertSearchText: string
  onAlertSearchTextChange: (value: string) => void
}

export function FilterModal({
  isOpen,
  onClose,
  selectedDate,
  onDateChange,
  selectedMetric,
  onMetricChange,
  windowBefore,
  onWindowBeforeChange,
  windowAfter,
  onWindowAfterChange,
  alertSources,
  onAlertSourcesChange,
  alertPriority,
  onAlertPriorityChange,
  alertSeverity,
  onAlertSeverityChange,
  alertSearchText,
  onAlertSearchTextChange
}: FilterModalProps) {
  if (!isOpen) return null

  const sourceOptions = [
    { value: 'coralogix', label: 'Coralogix' },
    { value: 'cloudflare', label: 'Cloudflare' },
    { value: 'sentry', label: 'Sentry' },
    { value: 'slack', label: 'Slack' }
  ]

  const priorityOptions = [
    { value: 'p1', label: 'P1' },
    { value: 'p2', label: 'P2' }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Filters</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <DatePicker
              label="Date (Applications Metrics)"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
            />
            
            <Select
              label="Metric"
              value={selectedMetric}
              onChange={(e) => onMetricChange(e.target.value as HourlyMetricField)}
              options={[
                { value: 'applications_created', label: 'Applications Created' },
                { value: 'applications_submitted', label: 'Applications Submitted' },
                { value: 'applications_approved', label: 'Applications Approved' },
                { value: 'applications_pending', label: 'Applications Pending' },
                { value: 'applications_nached', label: 'Applications NACHed' },
                { value: 'autopay_done_applications', label: 'Autopay Done Applications' }
              ]}
            />

            <Input
              label="Window Before (mins)"
              type="number"
              value={windowBefore.toString()}
              onChange={(e) => onWindowBeforeChange(parseInt(e.target.value) || 60)}
            />

            <Input
              label="Window After (mins)"
              type="number"
              value={windowAfter.toString()}
              onChange={(e) => onWindowAfterChange(parseInt(e.target.value) || 15)}
            />

            <MultiSelect
              label="Alert Sources"
              options={sourceOptions}
              value={alertSources}
              onChange={onAlertSourcesChange}
            />

            <MultiSelect
              label="Priority"
              options={priorityOptions}
              value={alertPriority}
              onChange={onAlertPriorityChange}
            />

            <Input
              label="Severity (comma-separated)"
              value={alertSeverity.join(',')}
              onChange={(e) => onAlertSeverityChange(
                e.target.value.split(',').map(s => s.trim()).filter(s => s)
              )}
            />

            <Input
              label="Search Alerts"
              value={alertSearchText}
              onChange={(e) => onAlertSearchTextChange(e.target.value)}
              placeholder="Search alert name, message..."
            />
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}



