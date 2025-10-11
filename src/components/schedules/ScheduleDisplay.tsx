import { Schedule, ScheduleLookups } from '@/types/scheduler'
import { useScheduleContext } from '@/providers/ScheduleProvider'
import { Button, Label, LinkButton } from '../ui/forms'
import { displayTime, formatFullDateTime } from '@/helpers/utils'
import { useEffect, useState } from 'react'
import Post from '../Post'

export default function ScheduleDisplay({
  schedule,
  onEdit,
  onDelete,
}: {
  schedule: Schedule
  onEdit: (schedule: Schedule) => void
  onDelete: (id: string) => void
}) {
  const { deleteSchedule, triggerSchedule, getScheduleLookups } =
    useScheduleContext()
  const [lookups, setLookups] = useState<ScheduleLookups | null>(null)
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
    const fetchScheduleLookups = async () => {
      const next = await getScheduleLookups(schedule.id!)
      if (next) {
        setLookups(next)
      } else {
        setLookups(null)
      }
    }
    fetchScheduleLookups()
  }, [schedule.id, getScheduleLookups])

  return (
    <>
      <div className="flex flex-row justify-between gap-4">
        <div>
          <div className="flex flex-col gap-4">
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
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Interval
              </span>
              <p className="text-gray-900 dark:text-gray-100 capitalize">
                {schedule.frequency.interval.every}{' '}
                {schedule.frequency.interval.unit}
              </p>
            </div>
            {schedule.frequency.timesOfDay &&
            schedule.frequency.timesOfDay.length > 0 ? (
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Times Of Day
                </span>
                <p className="text-gray-900 dark:text-gray-100">
                  {schedule.frequency.timesOfDay.length > 0
                    ? schedule.frequency.timesOfDay.map(displayTime).join(', ')
                    : 'N/A'}
                </p>
              </div>
            ) : null}
            {schedule.frequency.timeZone ? (
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Time Zone
                </span>
                <p className="text-gray-900 dark:text-gray-100">
                  {schedule.frequency.timeZone}
                </p>
              </div>
            ) : null}
            {schedule.frequency.daysOfWeek &&
            schedule.frequency.daysOfWeek.length > 0 ? (
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Days of the Week
                </span>
                <p className="text-gray-900 dark:text-gray-100">
                  {schedule.frequency.daysOfWeek.join(', ')}
                </p>
              </div>
            ) : null}
            {schedule.frequency.daysOfMonth &&
            schedule.frequency.daysOfMonth.length > 0 ? (
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Days of Month
                </span>
                <p className="text-gray-900 dark:text-gray-100">
                  {schedule.frequency.daysOfMonth.join(', ')}
                </p>
              </div>
            ) : null}

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
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => onEdit(schedule)}
            color="primary"
            variant="primary"
          >
            Edit Schedule
          </Button>
          <Button
            onClick={() => schedule.id && handleDelete(schedule.id)}
            color="danger"
            variant="primary"
          >
            Delete Schedule
          </Button>
          {lookups?.nextPost && (
            <Button
              onClick={() => schedule.id && handleTrigger(schedule.id)}
              variant="primary"
              color="tertiary"
            >
              Post Now
            </Button>
          )}
          {schedule.group && (
            <LinkButton
              href={`/groups/${encodeURIComponent(schedule.group)}`}
              variant="secondary"
              color="primary"
            >
              Go to Group
            </LinkButton>
          )}
        </div>
      </div>
      {lookups?.nextPostDate ? (
        <div>
          <Label>Next Post Date</Label>
          <div>{formatFullDateTime(lookups.nextPostDate)}</div>
        </div>
      ) : (
        <div>No next post date available.</div>
      )}
      {lookups?.nextPost ? (
        <div>
          <Label>Next Post</Label>
          <Post draftPost={lookups.nextPost} variant="compact" />
        </div>
      ) : (
        <div>No upcoming posts.</div>
      )}
    </>
  )
}
