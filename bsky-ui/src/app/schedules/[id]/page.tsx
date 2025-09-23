'use client'

import { useParams } from 'next/navigation'
import { useSchedules } from '@/hooks/useSchedules'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/forms'
import { DraftPost } from '@/types/drafts'
import { X, Plus } from 'lucide-react'
import { displayTime } from '@/helpers/utils'
import ScheduledPosts from './components/scheduled-posts'
import UnscheduledPosts from './components/unscheduled-posts'

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

export default function ScheduleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const {
    schedules,
    addPostToSchedule,
    removePostFromSchedule,
    getScheduledPosts,
    reorderSchedulePosts,
  } = useSchedules()

  const schedule = schedules.find((s) => s.id === id)

  // Get scheduled and unscheduled posts using state and effect
  const [scheduledPosts, setScheduledPosts] = useState<DraftPost[]>([])
  const [hasInitialized, setHasInitialized] = useState(false)

  // For drag-and-drop reordering (simple version)
  const [order, setOrder] = useState<string[]>([])

  const refresh = async () => {
    const scheduled = await getScheduledPosts(id)
    setScheduledPosts(scheduled)
    setOrder(
      scheduled.sort((a, b) => a.priority - b.priority).map((p) => p.meta.id)
    )
  }

  useEffect(() => {
    if (!hasInitialized) {
      refresh()
      setHasInitialized(true)
    }
  }, [hasInitialized])

  const handleAddToSchedule = async (postId: string) => {
    await addPostToSchedule(id, postId)
    await refresh()
  }

  const handleRemoveFromSchedule = async (postId: string) => {
    await removePostFromSchedule(id, postId)
    await refresh()
  }

  const handleReorder = async (newOrder: string[]) => {
    setOrder(newOrder)
    await reorderSchedulePosts(id, newOrder)
    await refresh()
  }

  if (!schedule) return <div>Schedule not found.</div>

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">{schedule.name}</h1>
      <div>
        <p>
          Every {schedule.frequency.interval.every}{' '}
          {schedule.frequency.interval.unit}
        </p>
        <p>
          Day of Week:{' '}
          {schedule.frequency.dayOfWeek
            ? DAYS_OF_WEEK[schedule.frequency.dayOfWeek]
            : 'N/A'}
        </p>
        <p>
          Day of Month:{' '}
          {schedule.frequency.dayOfMonth
            ? schedule.frequency.dayOfMonth
            : 'N/A'}
        </p>
        <p>
          Time of Day:{' '}
          {schedule.frequency.timeOfDay
            ? displayTime(schedule.frequency.timeOfDay)
            : 'N/A'}
        </p>
        <p>Timezone: {schedule.frequency.timeZone || 'N/A'}</p>
      </div>
      <div className="my-4 border-t" />
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1 min-w-0">
          <ScheduledPosts
            scheduledPosts={scheduledPosts}
            order={order}
            onRemoveFromSchedule={handleRemoveFromSchedule}
            onReorder={handleReorder}
          />
        </div>
      </div>
    </>
  )
}
