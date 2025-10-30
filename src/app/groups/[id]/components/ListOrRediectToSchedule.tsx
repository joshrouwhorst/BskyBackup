'use client'

import Spinner from '@/components/Spinner'
import Link from '@/components/ui/link'
import { useScheduleContext } from '@/providers/ScheduleProvider'
import type { Schedule } from '@/types/scheduler'

export default function ListOrRedirectToSchedule({
  group,
}: {
  group: string | null
}) {
  const { schedules, isLoading } = useScheduleContext()
  let matchedSchedules: Schedule[] = []

  if (isLoading) {
    return (
      <div>
        <Spinner />
      </div>
    )
  }

  if (group) {
    matchedSchedules = schedules.filter((s) => s.group === group)
    if (matchedSchedules.length === 1) {
      // Redirect to the schedule page
      window.location.href = `/schedules/${matchedSchedules[0].id}`
      return null
    }
  }

  // If no scheduleId or schedule doesn't exist, show the list
  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold">Group: {group}</h2>
      <p>Schedules for this group</p>
      <ul className="mt-4 space-y-3">
        {(group ? matchedSchedules : schedules).length === 0 ? (
          <li className="text-base text-gray-600 dark:text-gray-400">
            No schedules found.
          </li>
        ) : (
          (group ? matchedSchedules : schedules).map((schedule) => (
            <li key={schedule.id} className="flex items-start">
              <Link
                href={`/schedules/${schedule.id}`}
                className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100"
              >
                {schedule.name}
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
