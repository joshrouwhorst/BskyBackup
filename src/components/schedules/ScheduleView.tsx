import { Schedule } from '@/types/scheduler'
import { displayTime } from '@/helpers/utils'

const daysOfWeek = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

export default function ScheduleView({
  schedule,
  onEdit,
  onDelete,
}: {
  schedule: Schedule
  onEdit: (schedule: Schedule) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="flex justify-between items-start">
      <div>
        <h3 className="font-medium text-gray-900 dark:text-gray-100">
          {schedule.name}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
          ID: {schedule.id ?? 'NONE'}
        </p>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
          Group: {schedule.group ?? 'NONE'}
        </p>
        <div className="flex items-center mt-2 space-x-4">
          <span className="text-xs bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded">
            Every
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {schedule.frequency.interval.every}{' '}
            {schedule.frequency.interval.unit}
          </span>
        </div>
        <div className="flex items-center mt-2 space-x-4">
          <span className="text-xs bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded">
            Day Of Week
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {schedule.frequency.dayOfWeek !== undefined
              ? daysOfWeek[schedule.frequency.dayOfWeek]
              : 'N/A'}
          </span>
        </div>
        <div className="flex items-center mt-2 space-x-4">
          <span className="text-xs bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded">
            Day Of Month
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {schedule.frequency.dayOfMonth
              ? schedule.frequency.dayOfMonth
              : 'N/A'}
          </span>
        </div>
        <div className="flex items-center mt-2 space-x-4">
          <span className="text-xs bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded">
            Time of Day
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {schedule.frequency.timeOfDay
              ? displayTime(schedule.frequency.timeOfDay)
              : 'N/A'}
          </span>
        </div>

        <div className="flex items-center mt-2 space-x-4">
          <span className="text-xs bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded">
            Timezone
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {schedule.frequency.timeZone ? schedule.frequency.timeZone : 'N/A'}
          </span>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <span
          className={`w-3 h-3 rounded-full ${
            schedule.isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
          }`}
        />
      </div>
    </div>
  )
}
