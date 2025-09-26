import { Schedule } from '@/types/scheduler'
import { useScheduleContext } from '@/providers/ScheduleProvider'
import { Button, Label, LinkButton } from '../ui/forms'
import { displayTime } from '@/helpers/utils'
import { useEffect, useState } from 'react'
import Post from '../Post'
import { DraftPost } from '@/types/drafts'

export default function ScheduleDisplay({
  schedule,
  onEdit,
  onDelete,
}: {
  schedule: Schedule
  onEdit: (schedule: Schedule) => void
  onDelete: (id: string) => void
}) {
  const { deleteSchedule, triggerSchedule, getNextPost } = useScheduleContext()
  const [nextPost, setNextPost] = useState<DraftPost | null>(null)
  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this schedule?')) {
      await deleteSchedule(id)
      onDelete(id)
    }
  }

  const handleTrigger = async (id: string) => {
    if (confirm('Are you sure you want to post this schedule now?')) {
      await triggerSchedule(id)
      alert('Schedule posted successfully!')
    }
  }

  useEffect(() => {
    const fetchNextPost = async () => {
      const next = await getNextPost(schedule.id!)
      if (next) {
        setNextPost(next)
      } else {
        setNextPost(null)
      }
    }
    fetchNextPost()
  }, [schedule.id, getNextPost])

  return (
    <>
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          {schedule.name}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          ID: {schedule.id ?? 'NONE'}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Group: {schedule.group ?? 'NONE'}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Interval
          </span>
          <p className="text-gray-900 dark:text-gray-100 capitalize">
            {schedule.frequency.interval.every}{' '}
            {schedule.frequency.interval.unit}
          </p>
        </div>
        <div>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Time Of Day
          </span>
          <p className="text-gray-900 dark:text-gray-100">
            {schedule.frequency.timeOfDay
              ? displayTime(schedule.frequency.timeOfDay)
              : 'N/A'}
          </p>
        </div>
        <div>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Time Zone
          </span>
          <p className="text-gray-900 dark:text-gray-100">
            {schedule.frequency.timeZone}
          </p>
        </div>
        <div>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Day Of Week
          </span>
          <p className="text-gray-900 dark:text-gray-100">
            {schedule.frequency.dayOfWeek}
          </p>
        </div>
        <div>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Day Of Month
          </span>
          <p className="text-gray-900 dark:text-gray-100">
            {schedule.frequency.dayOfMonth
              ? schedule.frequency.dayOfMonth
              : 'N/A'}
          </p>
        </div>
      </div>
      <div>
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Status
        </span>
        <p
          className={`${
            schedule.isActive
              ? 'text-green-600 dark:text-green-400'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {schedule.isActive ? 'Active' : 'Inactive'}
        </p>
      </div>
      {nextPost && (
        <div>
          <Label>Next Post</Label>
          <Post draftPost={nextPost} />
        </div>
      )}
      <div className="flex space-x-3 pt-4">
        <Button
          onClick={() => onEdit(schedule)}
          color="primary"
          variant="primary"
        >
          Edit
        </Button>
        <Button
          onClick={() => schedule.id && handleDelete(schedule.id)}
          color="danger"
          variant="primary"
        >
          Delete
        </Button>
        <Button
          onClick={() => schedule.id && handleTrigger(schedule.id)}
          variant="outline"
          color="secondary"
        >
          Post Now
        </Button>
      </div>

    </>
  )
}
